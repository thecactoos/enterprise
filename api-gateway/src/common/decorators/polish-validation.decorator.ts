import { registerDecorator, ValidationOptions } from 'class-validator';
import { 
  IsPolishNIPConstraint,
  IsPolishREGONConstraint,
  IsPolishPostalCodeConstraint,
  IsPolishVoivodeshipConstraint,
  IsPolishPhoneNumberConstraint
} from '../validators/polish-business.validator';

/**
 * Validates Polish NIP (Tax Identification Number)
 * @param validationOptions Validation options
 */
export function IsPolishNIP(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPolishNIPConstraint,
    });
  };
}

/**
 * Validates Polish REGON (Business Registration Number)
 * @param validationOptions Validation options
 */
export function IsPolishREGON(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPolishREGONConstraint,
    });
  };
}

/**
 * Validates Polish postal code (XX-XXX format)
 * @param validationOptions Validation options
 */
export function IsPolishPostalCode(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPolishPostalCodeConstraint,
    });
  };
}

/**
 * Validates Polish voivodeship (województwo)
 * @param validationOptions Validation options
 */
export function IsPolishVoivodeship(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPolishVoivodeshipConstraint,
    });
  };
}

/**
 * Validates Polish phone number
 * @param validationOptions Validation options
 */
export function IsPolishPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPolishPhoneNumberConstraint,
    });
  };
}