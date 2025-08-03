import { Module } from '@nestjs/common';
import { PolishValidationController } from './polish-validation.controller';
import { 
  PolishBusinessValidationService,
  IsPolishNIPConstraint,
  IsPolishREGONConstraint,
  IsPolishPostalCodeConstraint,
  IsPolishVoivodeshipConstraint,
  IsPolishPhoneNumberConstraint
} from './validators/polish-business.validator';

@Module({
  controllers: [PolishValidationController],
  providers: [
    PolishBusinessValidationService,
    IsPolishNIPConstraint,
    IsPolishREGONConstraint,
    IsPolishPostalCodeConstraint,
    IsPolishVoivodeshipConstraint,
    IsPolishPhoneNumberConstraint,
  ],
  exports: [
    PolishBusinessValidationService,
    IsPolishNIPConstraint,
    IsPolishREGONConstraint,
    IsPolishPostalCodeConstraint,
    IsPolishVoivodeshipConstraint,
    IsPolishPhoneNumberConstraint,
  ],
})
export class PolishValidationModule {}