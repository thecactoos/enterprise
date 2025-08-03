import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PolishBusinessValidationService } from './validators/polish-business.validator';

class ValidateNIPDto {
  nip: string;
}

class ValidateREGONDto {
  regon: string;
}

class ValidatePostalCodeDto {
  postalCode: string;
}

class ValidateVoivodeshipDto {
  voivodeship: string;
}

class ValidatePhoneNumberDto {
  phoneNumber: string;
}

class ValidateBusinessEntityDto {
  nip?: string;
  regon?: string;
  postalCode?: string;
  voivodeship?: string;
  phoneNumber?: string;
}

@ApiTags('polish-validation')
@Controller('polish-validation')
export class PolishValidationController {
  constructor(
    private readonly polishValidationService: PolishBusinessValidationService
  ) {}

  @Post('nip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Polish NIP (Tax Identification Number)' })
  @ApiResponse({ status: 200, description: 'NIP validation result' })
  @ApiBody({ type: ValidateNIPDto })
  async validateNIP(@Body() body: ValidateNIPDto) {
    return this.polishValidationService.validateNIP(body.nip);
  }

  @Post('regon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Polish REGON (Business Registration Number)' })
  @ApiResponse({ status: 200, description: 'REGON validation result' })
  @ApiBody({ type: ValidateREGONDto })
  async validateREGON(@Body() body: ValidateREGONDto) {
    return this.polishValidationService.validateREGON(body.regon);
  }

  @Post('postal-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Polish postal code' })
  @ApiResponse({ status: 200, description: 'Postal code validation result' })
  @ApiBody({ type: ValidatePostalCodeDto })
  async validatePostalCode(@Body() body: ValidatePostalCodeDto) {
    return this.polishValidationService.validatePostalCode(body.postalCode);
  }

  @Post('voivodeship')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Polish voivodeship' })
  @ApiResponse({ status: 200, description: 'Voivodeship validation result' })
  @ApiBody({ type: ValidateVoivodeshipDto })
  async validateVoivodeship(@Body() body: ValidateVoivodeshipDto) {
    return this.polishValidationService.validateVoivodeship(body.voivodeship);
  }

  @Post('phone-number')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate Polish phone number' })
  @ApiResponse({ status: 200, description: 'Phone number validation result' })
  @ApiBody({ type: ValidatePhoneNumberDto })
  async validatePhoneNumber(@Body() body: ValidatePhoneNumberDto) {
    return this.polishValidationService.validatePhoneNumber(body.phoneNumber);
  }

  @Post('business-entity')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Comprehensive validation for Polish business entity' })
  @ApiResponse({ status: 200, description: 'Business entity validation result' })
  @ApiBody({ type: ValidateBusinessEntityDto })
  async validateBusinessEntity(@Body() body: ValidateBusinessEntityDto) {
    return this.polishValidationService.validateBusinessEntity(body);
  }
}