import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  Service, 
  ServiceCategory, 
  Material, 
  InstallationMethod, 
  FlooringForm, 
  Pattern,
  ServiceStatus 
} from './service.entity';

@Injectable()
export class ServicesSeeder {
  constructor(
    @InjectRepository(Service)
    private servicesRepository: Repository<Service>,
  ) {}

  async seedServices(): Promise<void> {
    console.log('🌱 Seeding flooring services...');

    const services = [
      // 🪵 1. Podłoga drewniana – montaż na klej (10 services)
      {
        serviceCode: 'WOOD_GLUE_PARQUET_IRREGULAR',
        serviceName: 'Montaż podłogi drewnianej na klej - parkiet nieregularnie',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PARQUET,
        pattern: Pattern.IRREGULAR,
        basePricePerM2: 45.00,
        minimumCharge: 300.00,
        timePerM2Minutes: 35,
        skillLevel: 4
      },
      {
        serviceCode: 'WOOD_GLUE_PARQUET_REGULAR',
        serviceName: 'Montaż podłogi drewnianej na klej - parkiet regularnie',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PARQUET,
        pattern: Pattern.REGULAR,
        basePricePerM2: 40.00,
        minimumCharge: 300.00,
        timePerM2Minutes: 30,
        skillLevel: 3
      },
      {
        serviceCode: 'WOOD_GLUE_PARQUET_HERRINGBONE_CLASSIC',
        serviceName: 'Montaż podłogi drewnianej na klej - parkiet jodła klasyczna',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PARQUET,
        pattern: Pattern.CLASSIC_HERRINGBONE,
        basePricePerM2: 55.00,
        minimumCharge: 400.00,
        timePerM2Minutes: 45,
        skillLevel: 5
      },
      {
        serviceCode: 'WOOD_GLUE_PARQUET_HERRINGBONE_FRENCH',
        serviceName: 'Montaż podłogi drewnianej na klej - parkiet jodła francuska',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PARQUET,
        pattern: Pattern.FRENCH_HERRINGBONE,
        basePricePerM2: 60.00,
        minimumCharge: 450.00,
        timePerM2Minutes: 50,
        skillLevel: 5
      },
      {
        serviceCode: 'WOOD_GLUE_PLANK_IRREGULAR',
        serviceName: 'Montaż podłogi drewnianej na klej - deska nieregularnie',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.IRREGULAR,
        basePricePerM2: 38.00,
        minimumCharge: 280.00,
        timePerM2Minutes: 28,
        skillLevel: 3
      },
      {
        serviceCode: 'WOOD_GLUE_PLANK_REGULAR',
        serviceName: 'Montaż podłogi drewnianej na klej - deska regularnie',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.REGULAR,
        basePricePerM2: 35.00,
        minimumCharge: 280.00,
        timePerM2Minutes: 25,
        skillLevel: 3
      },
      {
        serviceCode: 'WOOD_GLUE_PLANK_HERRINGBONE_CLASSIC',
        serviceName: 'Montaż podłogi drewnianej na klej - deska jodła klasyczna',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.CLASSIC_HERRINGBONE,
        basePricePerM2: 50.00,
        minimumCharge: 380.00,
        timePerM2Minutes: 40,
        skillLevel: 4
      },
      {
        serviceCode: 'WOOD_GLUE_PLANK_HERRINGBONE_CLASSIC_BARLINEK',
        serviceName: 'Montaż podłogi drewnianej na klej - deska jodła klasyczna Barlinek',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.CLASSIC_BARLINEK,
        basePricePerM2: 52.00,
        minimumCharge: 400.00,
        timePerM2Minutes: 42,
        skillLevel: 4
      },
      {
        serviceCode: 'WOOD_GLUE_PLANK_HERRINGBONE_FRENCH',
        serviceName: 'Montaż podłogi drewnianej na klej - deska jodła francuska',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.FRENCH_HERRINGBONE,
        basePricePerM2: 55.00,
        minimumCharge: 420.00,
        timePerM2Minutes: 45,
        skillLevel: 5
      },
      {
        serviceCode: 'WOOD_GLUE_PLANK_HERRINGBONE_FRENCH_BARLINEK',
        serviceName: 'Montaż podłogi drewnianej na klej - deska jodła francuska Barlinek',
        category: ServiceCategory.WOOD_GLUE,
        material: Material.WOOD,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.FRENCH_BARLINEK,
        basePricePerM2: 58.00,
        minimumCharge: 450.00,
        timePerM2Minutes: 48,
        skillLevel: 5
      },

      // 🪵 2. Podłoga drewniana – montaż na click (4 services)
      {
        serviceCode: 'WOOD_CLICK_PLANK_IRREGULAR',
        serviceName: 'Montaż podłogi drewnianej na click - deska nieregularnie',
        category: ServiceCategory.WOOD_CLICK,
        material: Material.WOOD,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.IRREGULAR,
        basePricePerM2: 28.00,
        minimumCharge: 220.00,
        timePerM2Minutes: 18,
        skillLevel: 2
      },
      {
        serviceCode: 'WOOD_CLICK_PLANK_REGULAR',
        serviceName: 'Montaż podłogi drewnianej na click - deska regularnie',
        category: ServiceCategory.WOOD_CLICK,
        material: Material.WOOD,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.REGULAR,
        basePricePerM2: 25.00,
        minimumCharge: 200.00,
        timePerM2Minutes: 15,
        skillLevel: 2
      },
      {
        serviceCode: 'WOOD_CLICK_PLANK_HERRINGBONE_CLASSIC_BARLINEK',
        serviceName: 'Montaż podłogi drewnianej na click - deska jodła klasyczna Barlinek',
        category: ServiceCategory.WOOD_CLICK,
        material: Material.WOOD,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.CLASSIC_BARLINEK,
        basePricePerM2: 35.00,
        minimumCharge: 280.00,
        timePerM2Minutes: 25,
        skillLevel: 3
      },
      {
        serviceCode: 'WOOD_CLICK_PLANK_HERRINGBONE_FRENCH_BARLINEK',
        serviceName: 'Montaż podłogi drewnianej na click - deska jodła francuska Barlinek',
        category: ServiceCategory.WOOD_CLICK,
        material: Material.WOOD,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.FRENCH_BARLINEK,
        basePricePerM2: 40.00,
        minimumCharge: 320.00,
        timePerM2Minutes: 30,
        skillLevel: 4
      },

      // 🧱 3. Laminat – montaż na klej (3 services)
      {
        serviceCode: 'LAMINATE_GLUE_PARQUET_HERRINGBONE_BERRY_ALLOC',
        serviceName: 'Montaż laminatu na klej - parkiet jodła klasyczna Berry Alloc',
        category: ServiceCategory.LAMINATE_GLUE,
        material: Material.LAMINATE,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PARQUET,
        pattern: Pattern.CLASSIC_BERRY_ALLOC,
        basePricePerM2: 32.00,
        minimumCharge: 250.00,
        timePerM2Minutes: 25,
        skillLevel: 3
      },
      {
        serviceCode: 'LAMINATE_GLUE_PLANK_IRREGULAR',
        serviceName: 'Montaż laminatu na klej - deska nieregularnie',
        category: ServiceCategory.LAMINATE_GLUE,
        material: Material.LAMINATE,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.IRREGULAR,
        basePricePerM2: 25.00,
        minimumCharge: 200.00,
        timePerM2Minutes: 20,
        skillLevel: 2
      },
      {
        serviceCode: 'LAMINATE_GLUE_PLANK_REGULAR_IPA',
        serviceName: 'Montaż laminatu na klej - deska regularnie + IPA',
        category: ServiceCategory.LAMINATE_GLUE,
        material: Material.LAMINATE,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.REGULAR_IPA,
        basePricePerM2: 28.00,
        minimumCharge: 220.00,
        timePerM2Minutes: 22,
        skillLevel: 3
      },

      // 🧱 4. Laminat – montaż na click (3 services)
      {
        serviceCode: 'LAMINATE_CLICK_PARQUET_HERRINGBONE_BERRY_ALLOC',
        serviceName: 'Montaż laminatu na click - parkiet jodła klasyczna Berry Alloc',
        category: ServiceCategory.LAMINATE_CLICK,
        material: Material.LAMINATE,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PARQUET,
        pattern: Pattern.CLASSIC_BERRY_ALLOC,
        basePricePerM2: 22.00,
        minimumCharge: 180.00,
        timePerM2Minutes: 15,
        skillLevel: 2
      },
      {
        serviceCode: 'LAMINATE_CLICK_PLANK_IRREGULAR',
        serviceName: 'Montaż laminatu na click - deska nieregularnie',
        category: ServiceCategory.LAMINATE_CLICK,
        material: Material.LAMINATE,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.IRREGULAR,
        basePricePerM2: 18.00,
        minimumCharge: 150.00,
        timePerM2Minutes: 12,
        skillLevel: 1
      },
      {
        serviceCode: 'LAMINATE_CLICK_PLANK_REGULAR_IPA',
        serviceName: 'Montaż laminatu na click - deska regularnie + IPA',
        category: ServiceCategory.LAMINATE_CLICK,
        material: Material.LAMINATE,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.REGULAR_IPA,
        basePricePerM2: 20.00,
        minimumCharge: 160.00,
        timePerM2Minutes: 14,
        skillLevel: 2
      },

      // 💿 5. Winyl – montaż na klej (4 services)
      {
        serviceCode: 'VINYL_GLUE_PLANK_IRREGULAR',
        serviceName: 'Montaż winylu na klej - deska nieregularnie',
        category: ServiceCategory.VINYL_GLUE,
        material: Material.VINYL,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.IRREGULAR,
        basePricePerM2: 30.00,
        minimumCharge: 240.00,
        timePerM2Minutes: 25,
        skillLevel: 3
      },
      {
        serviceCode: 'VINYL_GLUE_PLANK_REGULAR',
        serviceName: 'Montaż winylu na klej - deska regularnie',
        category: ServiceCategory.VINYL_GLUE,
        material: Material.VINYL,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.REGULAR,
        basePricePerM2: 28.00,
        minimumCharge: 220.00,
        timePerM2Minutes: 22,
        skillLevel: 2
      },
      {
        serviceCode: 'VINYL_GLUE_PLANK_HERRINGBONE_CLASSIC_ARBITON',
        serviceName: 'Montaż winylu na klej - deska jodła klasyczna Arbiton',
        category: ServiceCategory.VINYL_GLUE,
        material: Material.VINYL,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.CLASSIC_ARBITON,
        basePricePerM2: 35.00,
        minimumCharge: 280.00,
        timePerM2Minutes: 30,
        skillLevel: 4
      },
      {
        serviceCode: 'VINYL_GLUE_PLANK_HERRINGBONE_FRENCH_ARBITON',
        serviceName: 'Montaż winylu na klej - deska jodła francuska Arbiton',
        category: ServiceCategory.VINYL_GLUE,
        material: Material.VINYL,
        installationMethod: InstallationMethod.GLUE,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.FRENCH_ARBITON,
        basePricePerM2: 38.00,
        minimumCharge: 300.00,
        timePerM2Minutes: 33,
        skillLevel: 4
      },

      // 💿 6. Winyl – montaż na click (5 services)
      {
        serviceCode: 'VINYL_CLICK_PLANK_IRREGULAR',
        serviceName: 'Montaż winylu na click - deska nieregularnie',
        category: ServiceCategory.VINYL_CLICK,
        material: Material.VINYL,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.IRREGULAR,
        basePricePerM2: 20.00,
        minimumCharge: 160.00,
        timePerM2Minutes: 15,
        skillLevel: 2
      },
      {
        serviceCode: 'VINYL_CLICK_PLANK_REGULAR',
        serviceName: 'Montaż winylu na click - deska regularnie',
        category: ServiceCategory.VINYL_CLICK,
        material: Material.VINYL,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.REGULAR,
        basePricePerM2: 18.00,
        minimumCharge: 150.00,
        timePerM2Minutes: 12,
        skillLevel: 1
      },
      {
        serviceCode: 'VINYL_CLICK_PLANK_HERRINGBONE_CLASSIC_ARBITON',
        serviceName: 'Montaż winylu na click - deska jodła klasyczna Arbiton',
        category: ServiceCategory.VINYL_CLICK,
        material: Material.VINYL,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.CLASSIC_ARBITON,
        basePricePerM2: 25.00,
        minimumCharge: 200.00,
        timePerM2Minutes: 18,
        skillLevel: 3
      },
      {
        serviceCode: 'VINYL_CLICK_PLANK_HERRINGBONE_CLASSIC_UNIZIP',
        serviceName: 'Montaż winylu na click - deska jodła klasyczna Unizip (np. QS)',
        category: ServiceCategory.VINYL_CLICK,
        material: Material.VINYL,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.CLASSIC_UNIZIP,
        basePricePerM2: 27.00,
        minimumCharge: 220.00,
        timePerM2Minutes: 20,
        skillLevel: 3
      },
      {
        serviceCode: 'VINYL_CLICK_PLANK_HERRINGBONE_FRENCH_ARBITON',
        serviceName: 'Montaż winylu na click - deska jodła francuska Arbiton',
        category: ServiceCategory.VINYL_CLICK,
        material: Material.VINYL,
        installationMethod: InstallationMethod.CLICK,
        flooringForm: FlooringForm.PLANK,
        pattern: Pattern.FRENCH_ARBITON,
        basePricePerM2: 30.00,
        minimumCharge: 240.00,
        timePerM2Minutes: 22,
        skillLevel: 3
      },

      // 📦 7. Transport (1 service)
      {
        serviceCode: 'TRANSPORT_DELIVERY',
        serviceName: 'Transport materiałów',
        category: ServiceCategory.TRANSPORT,
        material: Material.TRANSPORT,
        installationMethod: InstallationMethod.TRANSPORT,
        flooringForm: FlooringForm.TRANSPORT,
        pattern: Pattern.TRANSPORT,
        basePricePerM2: 5.00,
        minimumCharge: 100.00,
        timePerM2Minutes: 0,
        skillLevel: 1
      },

      // 🪚 8. Listwy przypodłogowe (6 services)
      {
        serviceCode: 'BASEBOARD_MDF_10CM',
        serviceName: 'Listwa MDF do 10 cm z akrylowaniem dół/góra z materiałami',
        category: ServiceCategory.BASEBOARDS,
        material: Material.MDF_BASEBOARD,
        installationMethod: InstallationMethod.BASEBOARD_INSTALL,
        flooringForm: FlooringForm.BASEBOARD,
        pattern: Pattern.BASEBOARD_10CM,
        basePricePerM2: 15.00,
        minimumCharge: 120.00,
        timePerM2Minutes: 10,
        skillLevel: 2
      },
      {
        serviceCode: 'BASEBOARD_MDF_12CM',
        serviceName: 'Listwa MDF do 12 cm z akrylowaniem dół/góra z materiałami',
        category: ServiceCategory.BASEBOARDS,
        material: Material.MDF_BASEBOARD,
        installationMethod: InstallationMethod.BASEBOARD_INSTALL,
        flooringForm: FlooringForm.BASEBOARD,
        pattern: Pattern.BASEBOARD_12CM,
        basePricePerM2: 18.00,
        minimumCharge: 140.00,
        timePerM2Minutes: 12,
        skillLevel: 2
      },
      {
        serviceCode: 'BASEBOARD_MDF_15CM',
        serviceName: 'Listwa MDF do 15 cm z akrylowaniem dół/góra z materiałami',
        category: ServiceCategory.BASEBOARDS,
        material: Material.MDF_BASEBOARD,
        installationMethod: InstallationMethod.BASEBOARD_INSTALL,
        flooringForm: FlooringForm.BASEBOARD,
        pattern: Pattern.BASEBOARD_15CM,
        basePricePerM2: 22.00,
        minimumCharge: 160.00,
        timePerM2Minutes: 15,
        skillLevel: 2
      },
      {
        serviceCode: 'BASEBOARD_PLASTIC_10CM',
        serviceName: 'Listwa tworzywowa do 10 cm z akrylowaniem dół/góra z materiałami',
        category: ServiceCategory.BASEBOARDS,
        material: Material.PLASTIC_BASEBOARD,
        installationMethod: InstallationMethod.BASEBOARD_INSTALL,
        flooringForm: FlooringForm.BASEBOARD,
        pattern: Pattern.BASEBOARD_10CM,
        basePricePerM2: 12.00,
        minimumCharge: 100.00,
        timePerM2Minutes: 8,
        skillLevel: 1
      },
      {
        serviceCode: 'BASEBOARD_DOLLKEN',
        serviceName: 'Listwa Dollken bez kleju, ale z akrylem i usługą akrylowania',
        category: ServiceCategory.BASEBOARDS,
        material: Material.DOLLKEN_BASEBOARD,
        installationMethod: InstallationMethod.BASEBOARD_INSTALL,
        flooringForm: FlooringForm.BASEBOARD,
        pattern: Pattern.BASEBOARD_DOLLKEN,
        basePricePerM2: 25.00,
        minimumCharge: 180.00,
        timePerM2Minutes: 18,
        skillLevel: 3
      },
      {
        serviceCode: 'BASEBOARD_WENEV',
        serviceName: 'Listwa przypodłogowa WENEV',
        category: ServiceCategory.BASEBOARDS,
        material: Material.WENEV_BASEBOARD,
        installationMethod: InstallationMethod.BASEBOARD_INSTALL,
        flooringForm: FlooringForm.BASEBOARD,
        pattern: Pattern.BASEBOARD_WENEV,
        basePricePerM2: 20.00,
        minimumCharge: 150.00,
        timePerM2Minutes: 12,
        skillLevel: 2
      }
    ];

    for (const serviceData of services) {
      const existingService = await this.servicesRepository.findOne({
        where: { serviceCode: serviceData.serviceCode }
      });

      if (!existingService) {
        const service = this.servicesRepository.create({
          ...serviceData,
          status: ServiceStatus.ACTIVE,
          description: `Professional flooring service: ${serviceData.serviceName}`
        });

        await this.servicesRepository.save(service);
        console.log(`✅ Created service: ${serviceData.serviceCode}`);
      } else {
        console.log(`⏭️  Service already exists: ${serviceData.serviceCode}`);
      }
    }

    console.log('🌱 Services seeding completed!');
  }
}