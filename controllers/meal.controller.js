const { Meal } = require('../models');
const HttpStatus = require('../enums/httpStatusCode.enum');
const ResponseMessages = require('../enums/responseMessages.enum');

const mealController = {};

// Helper function to get current day of week
const getDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
};

// Get thali options based on day of week
mealController.getThaliOptions = async (req, res) => {
    try {
        const day = req.query.day || getDayOfWeek();
        const type = req.query.type;
        
        // Sunday is off
        if (day === 'sunday') {
            return res.success(
                HttpStatus.OK,
                "true",
                "We are closed on Sundays. Please check back tomorrow!",
                { message: "We are closed on Sundays. Please check back tomorrow!" }
            );
        }
        
        // Define thali options based on day
        let thaliOptions = [];
        
        // VEG thali is available every day
        thaliOptions.push({
            id: 1,
            type: "VEG",
            name: "Veg Thali",
            description: "Rice, Dal, Veg Curry, Papad, Salad",
            price: 99,
            imageUrl: "/images/meals/veg-thali.jpg",
            contents: [
                "Rice",
                "Dal",
                "Veg Curry (Regional)",
                "Salad",
                "Papad"
            ]
        });
        
        // NON-VEG thali availability depends on the day
        if (day !== 'monday' && day !== 'thursday') {
            let nonVegThali = {
                id: 2,
                type: "NON-VEG",
                name: "Non-Veg Thali",
                price: 99,
                imageUrl: "/images/meals/non-veg-thali.jpg",
                contents: [
                    "Rice",
                    "Dal",
                    "Veg Curry (Regional)",
                    "Salad",
                    "Papad"
                ]
            };
            
            if (day === 'tuesday' || day === 'saturday') {
                // Tuesday and Saturday: Veg + Egg curry
                nonVegThali.description = "Rice, Dal, Veg Curry, Egg Curry, Papad, Salad";
                nonVegThali.contents.push("Egg Curry");
            } else if (day === 'wednesday' || day === 'friday') {
                // Wednesday and Friday: Veg + Egg/Chicken/Fish
                nonVegThali.description = "Rice, Dal, Veg Curry, Choice of Egg/Chicken/Fish Curry, Papad, Salad";
                nonVegThali.contents.push("Choice of Egg/Chicken/Fish Curry");
            }
            
            thaliOptions.push(nonVegThali);
        }
        
        // KETO thali options
        if (day === 'monday' || day === 'thursday') {
            // Monday and Thursday: Only veg keto
            thaliOptions.push({
                id: 3,
                type: "KETO",
                name: "Keto Veg Thali",
                description: "Low-carb cauliflower rice with avocado and vegetables",
                price: 99,
                imageUrl: "/images/meals/keto-veg-thali.jpg",
                contents: [
                    "Keto Cauliflower Rice Bowl",
                    "Low-carb Vegetables",
                    "Avocado"
                ]
            });
        } else {
            // All other days: Both veg and non-veg keto
            thaliOptions.push({
                id: 3,
                type: "KETO",
                name: "Keto Veg Thali",
                description: "Low-carb cauliflower rice with avocado and vegetables",
                price: 99,
                imageUrl: "/images/meals/keto-veg-thali.jpg",
                contents: [
                    "Keto Cauliflower Rice Bowl",
                    "Low-carb Vegetables",
                    "Avocado"
                ]
            });
            
            thaliOptions.push({
                id: 4,
                type: "KETO",
                name: "Keto Non-Veg Thali",
                description: "Grilled chicken with avocado and mixed greens",
                price: 99,
                imageUrl: "/images/meals/keto-non-veg-thali.jpg",
                contents: [
                    "Keto Bowl with Grilled Chicken",
                    "Low-carb Vegetables",
                    "Avocado"
                ]
            });
        }
        
        // Filter by type if specified
        if (type && ['VEG', 'NON-VEG', 'KETO'].includes(type.toUpperCase())) {
            thaliOptions = thaliOptions.filter(thali => thali.type === type.toUpperCase());
        }
        
        return res.success(
            HttpStatus.OK,
            "true",
            `Thali options for ${day}${type ? ` (${type})` : ''} fetched successfully`,
            { thaliOptions }
        );
    } catch (error) {
        console.error("Error fetching thali options:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get thali by ID
mealController.getThaliById = async (req, res) => {
    try {
        const { id } = req.params;
        const day = req.query.day || getDayOfWeek();
        
        // Sunday is off
        if (day === 'sunday') {
            return res.success(
                HttpStatus.OK,
                "true",
                "We are closed on Sundays. Please check back tomorrow!",
                { message: "We are closed on Sundays. Please check back tomorrow!" }
            );
        }
        
        // Get all thali options for the day
        const allThalis = [];
        
        // VEG thali is available every day
        allThalis.push({
            id: 1,
            type: "VEG",
            name: "Veg Thali",
            description: "Rice, Dal, Veg Curry, Papad, Salad",
            price: 99,
            imageUrl: "/images/meals/veg-thali.jpg",
            contents: [
                "Rice",
                "Dal",
                "Veg Curry (Regional)",
                "Salad",
                "Papad"
            ]
        });
        
        // NON-VEG thali availability depends on the day
        if (day !== 'monday' && day !== 'thursday') {
            let nonVegThali = {
                id: 2,
                type: "NON-VEG",
                name: "Non-Veg Thali",
                price: 99,
                imageUrl: "/images/meals/non-veg-thali.jpg",
                contents: [
                    "Rice",
                    "Dal",
                    "Veg Curry (Regional)",
                    "Salad",
                    "Papad"
                ]
            };
            
            if (day === 'tuesday' || day === 'saturday') {
                // Tuesday and Saturday: Veg + Egg curry
                nonVegThali.description = "Rice, Dal, Veg Curry, Egg Curry, Papad, Salad";
                nonVegThali.contents.push("Egg Curry");
            } else if (day === 'wednesday' || day === 'friday') {
                // Wednesday and Friday: Veg + Egg/Chicken/Fish
                nonVegThali.description = "Rice, Dal, Veg Curry, Choice of Egg/Chicken/Fish Curry, Papad, Salad";
                nonVegThali.contents.push("Choice of Egg/Chicken/Fish Curry");
            }
            
            allThalis.push(nonVegThali);
        }
        
        // KETO thali options
        if (day === 'monday' || day === 'thursday') {
            // Monday and Thursday: Only veg keto
            allThalis.push({
                id: 3,
                type: "KETO",
                name: "Keto Veg Thali",
                description: "Low-carb cauliflower rice with avocado and vegetables",
                price: 99,
                imageUrl: "/images/meals/keto-veg-thali.jpg",
                contents: [
                    "Keto Cauliflower Rice Bowl",
                    "Low-carb Vegetables",
                    "Avocado"
                ]
            });
        } else {
            // All other days: Both veg and non-veg keto
            allThalis.push({
                id: 3,
                type: "KETO",
                name: "Keto Veg Thali",
                description: "Low-carb cauliflower rice with avocado and vegetables",
                price: 99,
                imageUrl: "/images/meals/keto-veg-thali.jpg",
                contents: [
                    "Keto Cauliflower Rice Bowl",
                    "Low-carb Vegetables",
                    "Avocado"
                ]
            });
            
            allThalis.push({
                id: 4,
                type: "KETO",
                name: "Keto Non-Veg Thali",
                description: "Grilled chicken with avocado and mixed greens",
                price: 99,
                imageUrl: "/images/meals/keto-non-veg-thali.jpg",
                contents: [
                    "Keto Bowl with Grilled Chicken",
                    "Low-carb Vegetables",
                    "Avocado"
                ]
            });
        }
        
        const thali = allThalis.find(t => t.id === parseInt(id));
        
        if (!thali) {
            return res.error(
                HttpStatus.NOT_FOUND,
                "false",
                "Thali not found or not available today",
                []
            );
        }
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Thali details fetched successfully",
            { thali }
        );
    } catch (error) {
        console.error("Error fetching thali details:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get weekly menu
mealController.getWeeklyMenu = async (req, res) => {
    try {
        const weeklyMenu = {
            monday: {
                VEG: "Rice, Dal, Veg Curry, Papad, Salad",
                NON_VEG: "Not available",
                KETO: "Keto Veg Thali only"
            },
            tuesday: {
                VEG: "Rice, Dal, Veg Curry, Papad, Salad",
                NON_VEG: "Veg Thali + Egg Curry",
                KETO: "Keto Veg Thali, Keto Non-Veg Thali"
            },
            wednesday: {
                VEG: "Rice, Dal, Veg Curry, Papad, Salad",
                NON_VEG: "Veg Thali + Choice of Egg/Chicken/Fish Curry",
                KETO: "Keto Veg Thali, Keto Non-Veg Thali"
            },
            thursday: {
                VEG: "Rice, Dal, Veg Curry, Papad, Salad",
                NON_VEG: "Not available",
                KETO: "Keto Veg Thali only"
            },
            friday: {
                VEG: "Rice, Dal, Veg Curry, Papad, Salad",
                NON_VEG: "Veg Thali + Choice of Egg/Chicken/Fish Curry",
                KETO: "Keto Veg Thali, Keto Non-Veg Thali"
            },
            saturday: {
                VEG: "Rice, Dal, Veg Curry, Papad, Salad",
                NON_VEG: "Veg Thali + Egg Curry",
                KETO: "Keto Veg Thali, Keto Non-Veg Thali"
            },
            sunday: {
                message: "We are closed on Sundays. Please check back tomorrow!"
            }
        };
        
        return res.success(
            HttpStatus.OK,
            "true",
            "Weekly menu fetched successfully",
            { weeklyMenu }
        );
    } catch (error) {
        console.error("Error fetching weekly menu:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

// Get available thali types for the day
mealController.getAvailableThaliTypes = async (req, res) => {
    try {
        const day = req.query.day || getDayOfWeek();
        
        // Sunday is off
        if (day === 'sunday') {
            return res.success(
                HttpStatus.OK,
                "true",
                "We are closed on Sundays. Please check back tomorrow!",
                { message: "We are closed on Sundays. Please check back tomorrow!" }
            );
        }
        
        const availableTypes = ['VEG']; // VEG is always available
        
        // NON-VEG availability depends on the day
        if (day !== 'monday' && day !== 'thursday') {
            availableTypes.push('NON-VEG');
        }
        
        // KETO is always available
        availableTypes.push('KETO');
        
        return res.success(
            HttpStatus.OK,
            "true",
            `Available thali types for ${day} fetched successfully`,
            { availableTypes }
        );
    } catch (error) {
        console.error("Error fetching available thali types:", error);
        return res.error(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "false",
            ResponseMessages.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = mealController;