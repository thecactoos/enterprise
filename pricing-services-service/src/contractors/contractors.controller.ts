import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { Contractor, ContractorStatus, RegionalZone, SkillLevel } from './contractor.entity';

@ApiTags('contractors')
@Controller('contractors')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new contractor' })
  @ApiResponse({ 
    status: 201, 
    description: 'Contractor successfully created',
    type: Contractor
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createContractorDto: CreateContractorDto): Promise<Contractor> {
    return await this.contractorsService.create(createContractorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contractors with optional filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of contractors retrieved successfully',
    type: [Contractor]
  })
  @ApiQuery({ name: 'status', enum: ContractorStatus, required: false })
  @ApiQuery({ name: 'regionalZone', enum: RegionalZone, required: false })
  @ApiQuery({ name: 'skillLevel', enum: SkillLevel, required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  async findAll(
    @Query('status') status?: ContractorStatus,
    @Query('regionalZone') regionalZone?: RegionalZone,
    @Query('skillLevel') skillLevel?: SkillLevel,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{ data: Contractor[]; total: number }> {
    return await this.contractorsService.findAll({
      status,
      regionalZone,
      skillLevel,
      search,
      limit,
      offset,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contractor by ID' })
  @ApiParam({ name: 'id', description: 'Contractor UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor retrieved successfully',
    type: Contractor
  })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Contractor> {
    return await this.contractorsService.findOne(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Get contractor by email' })
  @ApiParam({ name: 'email', description: 'Contractor email address' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor retrieved successfully',
    type: Contractor
  })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async findByEmail(@Param('email') email: string): Promise<Contractor> {
    return await this.contractorsService.findByEmail(email);
  }

  @Get('nip/:nip')
  @ApiOperation({ summary: 'Get contractor by NIP' })
  @ApiParam({ name: 'nip', description: 'Polish NIP number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor retrieved successfully',
    type: Contractor
  })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async findByNip(@Param('nip') nip: string): Promise<Contractor> {
    return await this.contractorsService.findByNip(nip);
  }

  @Get('zone/:regionalZone')
  @ApiOperation({ summary: 'Get contractors by regional zone' })
  @ApiParam({ name: 'regionalZone', enum: RegionalZone })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractors retrieved successfully',
    type: [Contractor]
  })
  async findByRegionalZone(@Param('regionalZone') regionalZone: RegionalZone): Promise<Contractor[]> {
    return await this.contractorsService.findByRegionalZone(regionalZone);
  }

  @Get('specialization/:specialization')
  @ApiOperation({ summary: 'Get contractors by specialization' })
  @ApiParam({ name: 'specialization', description: 'Specialization name' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractors retrieved successfully',
    type: [Contractor]
  })
  async findBySpecialization(@Param('specialization') specialization: string): Promise<Contractor[]> {
    return await this.contractorsService.findBySpecialization(specialization);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get contractor statistics' })
  @ApiParam({ name: 'id', description: 'Contractor UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor statistics retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async getStats(@Param('id', ParseUUIDPipe) id: string) {
    return await this.contractorsService.getContractorStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contractor' })
  @ApiParam({ name: 'id', description: 'Contractor UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor updated successfully',
    type: Contractor
  })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateContractorDto: UpdateContractorDto,
  ): Promise<Contractor> {
    return await this.contractorsService.update(id, updateContractorDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update contractor status' })
  @ApiParam({ name: 'id', description: 'Contractor UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor status updated successfully',
    type: Contractor
  })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ContractorStatus,
  ): Promise<Contractor> {
    return await this.contractorsService.updateStatus(id, status);
  }

  @Patch(':id/rating')
  @ApiOperation({ summary: 'Update contractor rating' })
  @ApiParam({ name: 'id', description: 'Contractor UUID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Contractor rating updated successfully',
    type: Contractor
  })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async updateRating(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rating') rating: number,
    @Body('jobsCompleted') jobsCompleted?: number,
  ): Promise<Contractor> {
    return await this.contractorsService.updateRating(id, rating, jobsCompleted);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete contractor' })
  @ApiParam({ name: 'id', description: 'Contractor UUID' })
  @ApiResponse({ status: 204, description: 'Contractor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.contractorsService.remove(id);
  }
}