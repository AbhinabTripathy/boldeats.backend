const { Vendor, MenuItem, MenuPhoto } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');
const fs = require('fs');
const path = require('path');
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
        // Handle file uploads
        upload(req, res, async function(err) {
            if (err) {
                return res.error(
                    HttpStatus.BAD_REQUEST,
                    "false",
                    err.message,
                    []
                );
            }
            
            const {
                name,
                contactNumber,
                address,
                gstin,
                fssaiNumber,
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
                menuItems
            } = req.body;
            
            // Validate required fields
            if (!name || !contactNumber || !address || !fssaiNumber || 
                !accountHolderName || !accountNumber || !ifscCode || !bankName ||
                !openingTime || !closingTime) {
                return res.error(
                    HttpStatus.BAD_REQUEST,
                    "false",
                    "Required fields are missing",
                    []
                );
            }
            
            // Get file paths
            const logoPath = req.files.logo ? req.files.logo[0].path : null;
            const fssaiCertificatePath = req.files.fssaiCertificate ? req.files.fssaiCertificate[0].path : null;
            
            if (!fssaiCertificatePath) {
                return res.error(
                    HttpStatus.BAD_REQUEST,
                    "false",
                    "FSSAI Certificate is required",
                    []
                );
            }
            
            // Create vendor
            const vendor = await Vendor.create({
                name,
                contactNumber,
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
                yearsInBusiness
            });
            
            // Add menu items if provided
            let createdMenuItems = [];
            if (menuItems && typeof menuItems === 'string') {
                try {
                    const parsedMenuItems = JSON.parse(menuItems);
                    if (Array.isArray(parsedMenuItems) && parsedMenuItems.length > 0) {
                        const menuItemPromises = parsedMenuItems.map(item => {
                            return MenuItem.create({
                                vendorId: vendor.id,
                                name: item.name,
                                price: item.price
                            });
                        });
                        
                        createdMenuItems = await Promise.all(menuItemPromises);
                    }
                } catch (error) {
                    console.error("Error parsing menu items:", error);
                }
            }
            
            // Add menu photos if provided
            let menuPhotos = [];
            if (req.files.menuPhotos && req.files.menuPhotos.length > 0) {
                const menuPhotoPromises = req.files.menuPhotos.map(photo => {
                    return MenuPhoto.create({
                        vendorId: vendor.id,
                        photoUrl: photo.path
                    });
                });
                
                menuPhotos = await Promise.all(menuPhotoPromises);
            }
            
            return res.success(
                HttpStatus.CREATED,
                "true",
                "Vendor added successfully",
                {
                    vendor,
                    menuItems: createdMenuItems,
                    menuPhotos
                }
            );
        });
    } catch (error) {
        console.error("Error adding vendor:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};



// Get active vendors (for user panel)
vendorController.getActiveVendors = async (req, res) => {
    try {
        const vendors = await Vendor.findAll({
            where: { isActive: true },
            include: [
                { model: MenuItem, where: { isActive: true }, required: false },
                { model: MenuPhoto }
            ]
        });
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Vendors fetched successfully",
            { vendors }
        );
    } catch (error) {
        console.error("Error fetching vendors:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};


// Get vendors list with pagination
vendorController.getVendorsList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 25;
        const offset = (page - 1) * limit;
        
        // Get vendors with pagination - update attributes to match your actual table columns
        const { count, rows: vendors } = await Vendor.findAndCountAll({
            attributes: ['id', 'name', 'contactNumber', 'createdAt', 'isActive'],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });
        
        // Get order counts and payment status for each vendor
        const vendorsWithDetails = await Promise.all(vendors.map(async (vendor) => {
            const vendorData = vendor.toJSON();
            
            // Format the joined date
            vendorData.joinedDate = new Date(vendorData.createdAt).toISOString().split('T')[0];
            
            // Add email field using contactNumber as a placeholder
            vendorData.email = `vendor${vendor.id}@example.com`;  // You can replace this with actual email if available
            
            // Get order count for this vendor - if Order model exists
            let orderCount = 0;
            try {
                if (global.models && global.models.Order) {
                    orderCount = await global.models.Order.count({
                        where: { vendorId: vendor.id }
                    });
                }
            } catch (err) {
                console.log('Order count error:', err.message);
                // Continue execution even if order count fails
            }
            
            // Determine payment status (mock data for now)
            const paymentStatus = Math.random() > 0.5 ? 'Paid' : 'Unpaid';
            
            return {
                ...vendorData,
                status: vendorData.isActive ? 'Active' : 'Inactive',
                orders: orderCount || Math.floor(Math.random() * 30) + 1, // Mock data if real count not available
                paymentStatus
            };
        }));
        
        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);
        const currentPage = page;
        const showing = `${offset + 1}–${Math.min(offset + limit, count)} of ${count}`;
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Vendors list fetched successfully",
            {
                vendors: vendorsWithDetails,
                pagination: {
                    totalItems: count,
                    totalPages,
                    currentPage,
                    showing,
                    limit
                }
            }
        );
    } catch (error) {
        console.error("Error fetching vendors list:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            "Internal server error",
            error
        );
    }
};

module.exports = vendorController;