import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const ACCOUNT_RECOVERY_WINDOW_MS = 24 * 60 * 60 * 1000;

const getCookieOptions = (req) => {
  const isSecureRequest = req.secure || req.headers["x-forwarded-proto"] === "https";

  return {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: isSecureRequest ? "none" : "lax",
    secure: isSecureRequest,
    domain: undefined,
  };
};

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (existingUser) {
      if (existingUser.deletedAt && Date.now() - existingUser.deletedAt.getTime() <= ACCOUNT_RECOVERY_WINDOW_MS) {
        existingUser.deletedAt = null;
        existingUser.isOnboarded = false;
        await existingUser.save();
        return issueAuthCookie(res, req, existingUser, 200, "Account recovered");
      }
      if (existingUser.deletedAt) {
        await User.findByIdAndDelete(existingUser._id);
      } else {
        return res.status(400).json({ message: "Email already exists, please use a diffrent one" });
      }
    }

    const randomAvatar = `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(fullName)}`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, getCookieOptions(req));

    console.log("Cookie set successfully");
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

    if (user.deletedAt) {
      if (Date.now() - user.deletedAt.getTime() > ACCOUNT_RECOVERY_WINDOW_MS) {
        await User.findByIdAndDelete(user._id);
        return res.status(410).json({ message: "This account was deleted permanently" });
      }

      user.deletedAt = null;
      user.isOnboarded = false;
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, getCookieOptions(req));

    console.log("Login cookie set successfully");
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  const cookieOptions = getCookieOptions(req);
  res.clearCookie("jwt", {
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    domain: undefined,
  });
  res.status(200).json({ success: true, message: "Logout successful" });
}

function issueAuthCookie(res, req, user, status, message) {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
  res.cookie("jwt", token, getCookieOptions(req));
  return res.status(status).json({ success: true, message, user });
}

export async function deleteAccount(req, res) {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      deletedAt: new Date(),
      isOnboarded: false,
    });

    const cookieOptions = getCookieOptions(req);
    res.clearCookie("jwt", cookieOptions);
    res.status(200).json({
      success: true,
      message: "Account deleted. You can recover it within 24 hours by logging in again.",
    });
  } catch (error) {
    console.error("Error deleting account", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;

    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
