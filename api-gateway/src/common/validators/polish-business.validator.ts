import { Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

/**
 * Polish NIP (Tax Identification Number) validator
 * Format: XXX-XXX-XX-XX or XXXXXXXXXX (10 digits with optional hyphens)
 */
@ValidatorConstraint({ name: 'IsPolishNIP', async: false })
@Injectable()
export class IsPolishNIPConstraint implements ValidatorConstraintInterface {
  validate(nip: string, args: ValidationArguments) {
    if (!nip) return true; // Allow empty values for optional fields
    
    // Remove all non-digit characters
    const cleanNip = nip.replace(/\D/g, '');
    
    // Check if it has exactly 10 digits
    if (cleanNip.length !== 10) {
      return false;
    }
    
    // Calculate checksum
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNip[i]) * weights[i];
    }
    
    const checksum = sum % 11;
    const lastDigit = parseInt(cleanNip[9]);
    
    return checksum === lastDigit;
  }

  defaultMessage(args: ValidationArguments) {
    return 'NIP must be a valid Polish tax identification number (10 digits with valid checksum)';
  }
}

/**
 * Polish REGON validator
 * Format: 9 or 14 digits
 */
@ValidatorConstraint({ name: 'IsPolishREGON', async: false })
@Injectable()
export class IsPolishREGONConstraint implements ValidatorConstraintInterface {
  validate(regon: string, args: ValidationArguments) {
    if (!regon) return true; // Allow empty values for optional fields
    
    // Remove all non-digit characters
    const cleanRegon = regon.replace(/\D/g, '');
    
    // REGON can be 9 or 14 digits
    if (cleanRegon.length !== 9 && cleanRegon.length !== 14) {
      return false;
    }
    
    return this.validateREGONChecksum(cleanRegon);
  }

  private validateREGONChecksum(regon: string): boolean {
    if (regon.length === 9) {
      const weights = [8, 9, 2, 3, 4, 5, 6, 7];
      let sum = 0;
      
      for (let i = 0; i < 8; i++) {
        sum += parseInt(regon[i]) * weights[i];
      }
      
      const checksum = sum % 11;
      const controlDigit = checksum === 10 ? 0 : checksum;
      
      return controlDigit === parseInt(regon[8]);
    } else if (regon.length === 14) {
      // First validate the 9-digit part
      if (!this.validateREGONChecksum(regon.substring(0, 9))) {
        return false;
      }
      
      // Then validate the full 14-digit number
      const weights = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];
      let sum = 0;
      
      for (let i = 0; i < 13; i++) {
        sum += parseInt(regon[i]) * weights[i];
      }
      
      const checksum = sum % 11;
      const controlDigit = checksum === 10 ? 0 : checksum;
      
      return controlDigit === parseInt(regon[13]);
    }
    
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'REGON must be a valid Polish business registration number (9 or 14 digits with valid checksum)';
  }
}

/**
 * Polish postal code validator
 * Format: XX-XXX (2 digits, hyphen, 3 digits)
 */
@ValidatorConstraint({ name: 'IsPolishPostalCode', async: false })
@Injectable()
export class IsPolishPostalCodeConstraint implements ValidatorConstraintInterface {
  validate(postalCode: string, args: ValidationArguments) {
    if (!postalCode) return true; // Allow empty values for optional fields
    
    const polishPostalCodeRegex = /^\d{2}-\d{3}$/;
    return polishPostalCodeRegex.test(postalCode);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Postal code must be in Polish format (XX-XXX)';
  }
}

/**
 * Polish voivodeship (województwo) validator
 */
@ValidatorConstraint({ name: 'IsPolishVoivodeship', async: false })
@Injectable()
export class IsPolishVoivodeshipConstraint implements ValidatorConstraintInterface {
  private readonly validVoivodeships = [
    'dolnośląskie',
    'kujawsko-pomorskie', 
    'lubelskie',
    'lubuskie',
    'łódzkie',
    'małopolskie',
    'mazowieckie',
    'opolskie',
    'podkarpackie',
    'podlaskie',
    'pomorskie',
    'śląskie',
    'świętokrzyskie',
    'warmińsko-mazurskie',
    'wielkopolskie',
    'zachodniopomorskie'
  ];

  validate(voivodeship: string, args: ValidationArguments) {
    if (!voivodeship) return true; // Allow empty values for optional fields
    
    return this.validVoivodeships.includes(voivodeship.toLowerCase());
  }

  defaultMessage(args: ValidationArguments) {
    return `Voivodeship must be one of: ${this.validVoivodeships.join(', ')}`;
  }
}

/**
 * Polish phone number validator
 * Supports various Polish phone number formats
 */
@ValidatorConstraint({ name: 'IsPolishPhoneNumber', async: false })
@Injectable()
export class IsPolishPhoneNumberConstraint implements ValidatorConstraintInterface {
  validate(phoneNumber: string, args: ValidationArguments) {
    if (!phoneNumber) return true; // Allow empty values for optional fields
    
    // Remove all non-digit characters except +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Polish phone number patterns:
    // +48 XXX XXX XXX (mobile)
    // +48 XX XXX XX XX (landline)
    // 48XXXXXXXXX
    // 0XXXXXXXXX (9 digits after 0)
    // XXXXXXXXX (9 digits mobile)
    
    const patterns = [
      /^\+48\d{9}$/, // +48XXXXXXXXX
      /^48\d{9}$/,   // 48XXXXXXXXX
      /^0\d{9}$/,    // 0XXXXXXXXX
      /^\d{9}$/      // XXXXXXXXX
    ];
    
    return patterns.some(pattern => pattern.test(cleanNumber));
  }

  defaultMessage(args: ValidationArguments) {
    return 'Phone number must be a valid Polish phone number';
  }
}

/**
 * Business validation service for Polish-specific data
 */
@Injectable()
export class PolishBusinessValidationService {
  /**
   * Validate Polish NIP number
   */
  validateNIP(nip: string): { isValid: boolean; message?: string } {
    const validator = new IsPolishNIPConstraint();
    const isValid = validator.validate(nip, {} as ValidationArguments);
    
    return {
      isValid,
      message: isValid ? undefined : validator.defaultMessage({} as ValidationArguments)
    };
  }

  /**
   * Validate Polish REGON number
   */
  validateREGON(regon: string): { isValid: boolean; message?: string } {
    const validator = new IsPolishREGONConstraint();
    const isValid = validator.validate(regon, {} as ValidationArguments);
    
    return {
      isValid,
      message: isValid ? undefined : validator.defaultMessage({} as ValidationArguments)
    };
  }

  /**
   * Validate Polish postal code
   */
  validatePostalCode(postalCode: string): { isValid: boolean; message?: string } {
    const validator = new IsPolishPostalCodeConstraint();
    const isValid = validator.validate(postalCode, {} as ValidationArguments);
    
    return {
      isValid,
      message: isValid ? undefined : validator.defaultMessage({} as ValidationArguments)
    };
  }

  /**
   * Validate Polish voivodeship
   */
  validateVoivodeship(voivodeship: string): { isValid: boolean; message?: string } {
    const validator = new IsPolishVoivodeshipConstraint();
    const isValid = validator.validate(voivodeship, {} as ValidationArguments);
    
    return {
      isValid,
      message: isValid ? undefined : validator.defaultMessage({} as ValidationArguments)
    };
  }

  /**
   * Validate Polish phone number
   */
  validatePhoneNumber(phoneNumber: string): { isValid: boolean; message?: string } {
    const validator = new IsPolishPhoneNumberConstraint();
    const isValid = validator.validate(phoneNumber, {} as ValidationArguments);
    
    return {
      isValid,
      message: isValid ? undefined : validator.defaultMessage({} as ValidationArguments)
    };
  }

  /**
   * Comprehensive validation for Polish business entity
   */
  validateBusinessEntity(entity: {
    nip?: string;
    regon?: string;
    postalCode?: string;
    voivodeship?: string;
    phoneNumber?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (entity.nip) {
      const nipValidation = this.validateNIP(entity.nip);
      if (!nipValidation.isValid) {
        errors.push(`NIP: ${nipValidation.message}`);
      }
    }

    if (entity.regon) {
      const regonValidation = this.validateREGON(entity.regon);
      if (!regonValidation.isValid) {
        errors.push(`REGON: ${regonValidation.message}`);
      }
    }

    if (entity.postalCode) {
      const postalCodeValidation = this.validatePostalCode(entity.postalCode);
      if (!postalCodeValidation.isValid) {
        errors.push(`Postal Code: ${postalCodeValidation.message}`);
      }
    }

    if (entity.voivodeship) {
      const voivodeshipValidation = this.validateVoivodeship(entity.voivodeship);
      if (!voivodeshipValidation.isValid) {
        errors.push(`Voivodeship: ${voivodeshipValidation.message}`);
      }
    }

    if (entity.phoneNumber) {
      const phoneValidation = this.validatePhoneNumber(entity.phoneNumber);
      if (!phoneValidation.isValid) {
        errors.push(`Phone Number: ${phoneValidation.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}