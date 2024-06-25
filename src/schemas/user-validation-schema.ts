import { body } from "express-validator";

export const registerUserValidationSchema = [
  body("fullName")
    .exists({ values: "falsy" })
    .withMessage("The name must be provided"),
  body("userName")
    .exists({ values: "falsy" })
    .withMessage("Username must be provided")
    .isLength({ min: 2, max: 100 }),
  body("email").isEmail().withMessage("Email is not valid"),
  body("password")
    .exists({ values: "falsy" })
    .withMessage("Password must be provided"),
];

export const loginUserValidationSchema = [
  body("userName")
    .exists({ values: "falsy" })
    .withMessage("Username must be provided")
    .isLength({ min: 2, max: 100 }),
  body("password")
    .exists({ values: "falsy" })
    .withMessage("Password must be provided"),
];

export const updateUserValidationSchema = [
  body("userName")
    .optional()
    .isString()
    .withMessage("Username must be a string"),
  body("email")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Email is not valid"),
  body("age").optional().isNumeric(),
];
