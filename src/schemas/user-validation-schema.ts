import { body } from "express-validator";

export const createUserValidationSchema = [
  body("name")
    .exists({ values: "falsy" })
    .withMessage("Name must be provided")
    .isLength({ min: 2, max: 100 }),
  body("email").isEmail().withMessage("Email is not valid"),
];

export const updateUserValidationSchema = [
  body("name").optional().isString().withMessage("Name must be a string"),
  body("email")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Email is not valid"),
  body("age").optional().isNumeric(),
];
