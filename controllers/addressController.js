const Address = require("../models/address");

// Get all addresses of a user
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId || req.query?.userId;
    
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, created_at: -1 });

    return res.status(200).json({
      message: "Addresses fetched successfully",
      data: addresses,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get single address by ID
exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body?.userId || req.query?.userId;

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    return res.status(200).json({
      message: "Address fetched successfully",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Add new address
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Validation
    if (!name || !phone || !addressLine1 || !city || !state || !pincode) {
      return res.status(400).json({
        message: "Name, phone, addressLine1, city, state, and pincode are required",
      });
    }

    // If this address is set as default, remove default from other addresses
    if (isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    // If this is the first address, make it default
    const existingAddresses = await Address.countDocuments({ user: userId });
    const shouldBeDefault = isDefault || existingAddresses === 0;

    const address = await Address.create({
      user: userId,
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      pincode,
      isDefault: shouldBeDefault,
    });

    return res.status(201).json({
      message: "Address added successfully",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body?.userId;
    const { name, phone, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // If setting this address as default, remove default from others
    if (isDefault && !address.isDefault) {
      await Address.updateMany({ user: userId, _id: { $ne: id } }, { isDefault: false });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        name: name || address.name,
        phone: phone || address.phone,
        addressLine1: addressLine1 || address.addressLine1,
        addressLine2: addressLine2 !== undefined ? addressLine2 : address.addressLine2,
        city: city || address.city,
        state: state || address.state,
        pincode: pincode || address.pincode,
        isDefault: isDefault !== undefined ? isDefault : address.isDefault,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body?.userId || req.query?.userId;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const address = await Address.findOneAndDelete({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // If deleted address was default, make the first remaining address default
    if (address.isDefault) {
      const firstAddress = await Address.findOne({ user: userId });
      if (firstAddress) {
        firstAddress.isDefault = true;
        await firstAddress.save();
      }
    }

    return res.status(200).json({
      message: "Address deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Set address as default
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body?.userId;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const address = await Address.findOne({ _id: id, user: userId });

    if (!address) {
      return res.status(404).json({
        message: "Address not found",
      });
    }

    // Remove default from all addresses
    await Address.updateMany({ user: userId }, { isDefault: false });

    // Set this address as default
    address.isDefault = true;
    await address.save();

    return res.status(200).json({
      message: "Default address updated successfully",
      data: address,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
