const { Vendor, MenuItem, MenuPhoto ,MenuSection } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 

const multer = require('multer');

const vendorController = {};

// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/';
        
        if (file.fieldname === 'logo') {
            uploadPath += 'vendors/logos';
        } else if (file.fieldname === 'fssaiCertificate') {
            uploadPath += 'vendors/certificates';
        } else if (file.fieldname === 'menuPhotos') {
            uploadPath += 'vendors/menus';
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'logo' || file.fieldname === 'menuPhotos') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed!'));
            }
        } else if (file.fieldname === 'fssaiCertificate') {
            if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only PDF or image files are allowed for certificates!'));
            }
        } else {
            cb(null, true);
        }
    }
}).fields([
    { name: 'logo', maxCount: 1 },
    { name: 'fssaiCertificate', maxCount: 1 },
    { name: 'menuPhotos', maxCount: 5 }
]);

// Add new vendor
vendorController.addVendor = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                return res.error(HttpStatus.BAD_REQUEST, "false", err.message, []);
            }

            const {
                name, phoneNumber, address, gstin, fssaiNumber,
                accountHolderName, accountNumber, ifscCode, bankName,
                branch, openingTime, closingTime,
                subscriptionPrice15Days, subscriptionPriceMonthly,
                yearsInBusiness, menuType, password,email
            } = req.body;

            // Parse mealTypes safely
            let processedMealTypes = [];
            try {
                processedMealTypes = JSON.parse(req.body.mealTypes);
            } catch (e) {
                return res.error(HttpStatus.BAD_REQUEST, "false", "Invalid mealTypes JSON", []);
            }

            // Parse menuSections safely
            let parsedMenuSections = [];
            try {
                parsedMenuSections = JSON.parse(req.body.menuSections);
            } catch (e) {
                return res.error(HttpStatus.BAD_REQUEST, "false", "Invalid menuSections JSON", []);
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const logoPath = req.files.logo?.[0]?.path || null;
            const fssaiCertificatePath = req.files.fssaiCertificate?.[0]?.path || null;

            const t = await sequelize.transaction();

            try {
                // Create vendor
                const vendor = await Vendor.create({
                    name,
                    phoneNumber,
                    address,
                    logo: logoPath,
                    gstin,
                    fssaiNumber,
                    fssaiCertificate: fssaiCertificatePath,
                    accountHolderName,
                    accountNumber,
                    ifscCode,
                    bankName,
                    branch,
                    openingTime,
                    closingTime,
                    subscriptionPrice15Days,
                    subscriptionPriceMonthly,
                    yearsInBusiness,
                    menuType,
                    email,
                    mealTypes: processedMealTypes,
                    password: hashedPassword
                }, { transaction: t });

                // Save menu sections & menu items
                for (const section of parsedMenuSections) {
                    const menuSection = await MenuSection.create({
                        vendorId: vendor.id,
                        sectionName: section.sectionName || 'MENU 1',
                        menuType: section.menuType || vendor.menuType || 'both',
                        mealType: section.mealType || (processedMealTypes.length > 0 ? processedMealTypes[0] : 'Lunch')
                    }, { transaction: t });

                    if (section.menuItems && Array.isArray(section.menuItems)) {
                        for (const item of section.menuItems) {
                            await MenuItem.create({
                                menuSectionId: menuSection.id,
                                vendorId: vendor.id,
                                dayOfWeek: item.dayOfWeek,
                                items: item.items
                            }, { transaction: t });
                        }
                    }
                }

                // Handle menu photos
                if (req.files.menuPhotos) {
                    for (const photo of req.files.menuPhotos) {
                        await MenuPhoto.create({
                            vendorId: vendor.id,
                            photoUrl: photo.path
                        }, { transaction: t });
                    }
                }

                await t.commit();

                // Fetch and include formatted menu in response
                const sections = await MenuSection.findAll({
                    where: { vendorId: vendor.id },
                    include: [{
                        model: MenuItem,
                        as: 'menuItems',
                        attributes: ['dayOfWeek', 'items']
                    }],
                    attributes: ['sectionName']
                });

                const formattedMenu = sections.map(section => ({
                    sectionName: section.sectionName,
                    menuItems: section.menuItems.map(item => ({
                        dayOfWeek: item.dayOfWeek,
                        items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items
                    }))
                }));

                return res.success(HttpStatus.CREATED, "true", "Vendor added successfully", {
                    ...vendor.toJSON(),
                    mealTypes: processedMealTypes,
                    menu: formattedMenu
                });

            } catch (error) {
                await t.rollback();
                return res.error(HttpStatus.INTERNAL_SERVER_ERROR, "false", error.message, []);
            }
        });
    } catch (error) {
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, "false", error.message, []);
    }
};




// Vendor login method
vendorController.login = async (req, res) => {
    try {
        const { phoneNumber, password } = req.body;
        
        // Validate input
        if (!phoneNumber || !password) {
            return res.error(
                HttpStatus.BAD_REQUEST,
                "false",
                "Phone number and password are required",
                []
            );
        }
        
        // Find vendor by phone number
        const vendor = await Vendor.findOne({ 
            where: { phoneNumber },
            attributes: ['id', 'name', 'phoneNumber', 'password', 'isActive'] 
        });
        
        if (!vendor) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Vendor not found",
                []
            );
        }
        
        // Check if vendor is active
        if (!vendor.isActive) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                "false",
                "Your account is inactive. Please contact admin.",
                []
            );
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, vendor.password);
        if (!isValidPassword) {
            return res.error(
                HttpStatus.UNAUTHORIZED,
                "false",
                "Invalid credentials",
                []
            );
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: vendor.id,
                contactNumber: vendor.phoneNumber,
                role: 'vendor'
            },
            process.env.APP_SUPER_SECRET_KEY,
            { expiresIn: '24h' }
        );
        
        // Remove password from response
        const vendorResponse = vendor.toJSON();
        delete vendorResponse.password;
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Login successful",
            {
                vendor: vendorResponse,
                token
            }
        );
        
    } catch (error) {
        console.error("Vendor login error:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

//for based on the meal type ............................

vendorController.getMenuByMealType = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { mealType } = req.query;

    if (!mealType || !["lunch", "dinner", "breakfast"].includes(mealType.toLowerCase())) {
      return res.error(400, "false", "Invalid or missing mealType", []);
    }

    // Fetch menu sections of the vendor by mealType
    const sections = await MenuSection.findAll({
      where: {
        vendorId,
        mealType: mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase()
      },
      include: [
        {
          model: MenuItem,
          attributes: ["dayOfWeek", "items"],
          where: { isActive: true },
          required: true
        }
      ]
    });

    // Group by day
    const dayMap = {};
    sections.forEach(section => {
      section.menuItems.forEach(item => {
        const day = item.dayOfWeek;
        const foods = typeof item.items === "string" ? JSON.parse(item.items) : item.items;

        if (!dayMap[day]) dayMap[day] = [];

        dayMap[day].push(...foods);
      });
    });

    const groupedMenu = Object.entries(dayMap).map(([day, items]) => ({
      dayOfWeek: day,
      items
    }));

    return res.success(200, "true", "Menu fetched successfully", {
      vendorId,
      mealType,
      menu: groupedMenu
    });

  } catch (error) {
    return res.error(500, "false", error.message, []);
  }
};


// Update vendor details
vendorController.updateVendor = async (req, res) => {
    try {
        upload(req, res, async function (err) {
            if (err) {
                return res.error(HttpStatus.BAD_REQUEST, "false", err.message, []);
            }

            const { id } = req.params;
            const {
                name, phoneNumber, address, gstin, fssaiNumber,
                accountHolderName, accountNumber, ifscCode, bankName,
                branch, openingTime, closingTime,
                subscriptionPrice15Days, subscriptionPriceMonthly,
                yearsInBusiness, menuType
            } = req.body;

            // Parse mealTypes safely
            let processedMealTypes = [];
            try {
                processedMealTypes = JSON.parse(req.body.mealTypes);
            } catch (e) {
                processedMealTypes = [];
            }

            // Parse menuSections safely
            let parsedMenuSections = [];
            try {
                parsedMenuSections = JSON.parse(req.body.menuSections);
            } catch (e) {
                return res.error(HttpStatus.BAD_REQUEST, "false", "Invalid menuSections JSON", []);
            }

            const t = await sequelize.transaction();

            try {
                const vendor = await Vendor.findByPk(id);
                if (!vendor) {
                    await t.rollback();
                    return res.error(HttpStatus.NOT_FOUND, "false", "Vendor not found", []);
                }

                // Update vendor details
                const updateData = {
                    name, phoneNumber, address, gstin, fssaiNumber,
                    accountHolderName, accountNumber, ifscCode, bankName,
                    branch, openingTime, closingTime,
                    subscriptionPrice15Days, subscriptionPriceMonthly,
                    yearsInBusiness,
                    menuType,
                    mealTypes: processedMealTypes
                };

                // Update files if provided
                if (req.files.logo) {
                    updateData.logo = req.files.logo[0].path;
                }
                if (req.files.fssaiCertificate) {
                    updateData.fssaiCertificate = req.files.fssaiCertificate[0].path;
                }

                await vendor.update(updateData, { transaction: t });

                // Delete existing menu sections and items
                await MenuSection.destroy({
                    where: { vendorId: id },
                    transaction: t
                });

                // Create new menu sections and items
                for (const section of parsedMenuSections) {
                    const menuSection = await MenuSection.create({
                        vendorId: id,
                        sectionName: section.sectionName || 'MENU 1',
                        menuType: section.menuType || vendor.menuType || 'both',
                        mealType: section.mealType || (processedMealTypes.length > 0 ? processedMealTypes[0] : 'Lunch')
                    }, { transaction: t });

                    if (section.menuItems && Array.isArray(section.menuItems)) {
                        for (const item of section.menuItems) {
                            await MenuItem.create({
                                menuSectionId: menuSection.id,
                                vendorId: id,
                                dayOfWeek: item.dayOfWeek,
                                items: item.items
                            }, { transaction: t });
                        }
                    }
                }

                // Update menu photos if provided
                if (req.files.menuPhotos) {
                    await MenuPhoto.destroy({
                        where: { vendorId: id },
                        transaction: t
                    });

                    for (const photo of req.files.menuPhotos) {
                        await MenuPhoto.create({
                            vendorId: id,
                            photoUrl: photo.path
                        }, { transaction: t });
                    }
                }

                await t.commit();

                // Fetch updated menu for response
                const sections = await MenuSection.findAll({
                    where: { vendorId: id },
                    include: [{
                        model: MenuItem,
                        as: 'menuItems',
                        attributes: ['dayOfWeek', 'items']
                    }],
                    attributes: ['sectionName']
                });

                const formattedMenu = sections.map(section => ({
                    sectionName: section.sectionName,
                    menuItems: section.menuItems.map(item => ({
                        dayOfWeek: item.dayOfWeek,
                        items: typeof item.items === 'string' ? JSON.parse(item.items) : item.items
                    }))
                }));

                return res.success(HttpStatus.OK, "true", "Vendor updated successfully", {
                    ...vendor.toJSON(),
                    mealTypes: processedMealTypes,
                    menu: formattedMenu
                });

            } catch (error) {
                await t.rollback();
                return res.error(HttpStatus.INTERNAL_SERVER_ERROR, "false", error.message, []);
            }
        });
    } catch (error) {
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, "false", error.message, []);
    }
};

// List all vendors
vendorController.listVendors = async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            attributes: {
                exclude: ['password'] // Exclude password from the result
            }
        });
        return res.success(HttpStatus.OK, "true", "Vendors retrieved successfully", vendors);
    } catch (error) {
        return res.error(HttpStatus.INTERNAL_SERVER_ERROR, "false", error.message, []);
    }
};

vendorController.toggleVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      return res.error(404, "false", "Vendor not found", []);
    }

    // Toggle isActive status
    const newStatus = !vendor.isActive;

    await vendor.update({ isActive: newStatus });

    return res.success(200, "true", `Vendor status updated to ${newStatus ? 'active' : 'inactive'}`, {
      id: vendor.id,
      isActive: newStatus
    });

  } catch (error) {
    return res.error(500, "false", error.message, []);
  }
};


vendorController.deleteVendor = async (req, res, next) => {
  try {
    const vendorId = req.params.id;

    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      return res.status(404).json({
        status: 404,
        success: false,
        message: 'Vendor not found'
      });
    }

    await vendor.destroy();

    return res.status(200).json({
      status: 200,
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};


module.exports = vendorController;
