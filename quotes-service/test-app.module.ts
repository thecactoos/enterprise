import { Module, Controller, Get } from '@nestjs/common';

@Controller()
class TestController {
  @Get('health')
  health() {
    return { status: 'OK', service: 'test' };
  }
}

@Module({
  controllers: [TestController],
})
export class TestAppModule {}