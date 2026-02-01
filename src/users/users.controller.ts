import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserRole } from './schemas/user.schema';
import * as multer from 'multer';

const storage = multer.memoryStorage();
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only image files are allowed') as any, false);
  }
};

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<UserDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserDto,
  ): Promise<UserDto> {
    // Users can only update their own profile, except admins
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  }))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: UserDto,
  ): Promise<{ avatarUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Delete old avatar if exists
      if (currentUser.avatar) {
        const publicId = this.cloudinaryService.extractPublicId(currentUser.avatar);
        if (publicId) {
          try {
            await this.cloudinaryService.deleteImage(publicId);
          } catch (error) {
            // Ignore delete errors
          }
        }
      }

      const avatarUrl = await this.cloudinaryService.uploadImage(file, 'avatars');
      
      // Update user avatar
      await this.usersService.update(currentUser.id, { avatar: avatarUrl });
      
      return { avatarUrl };
    } catch (error) {
      throw new BadRequestException('Failed to upload avatar');
    }
  }

  @Patch('me/profile')
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserDto,
  ): Promise<UserDto> {
    // Users can only update name and email, not role or isActive
    const allowedFields: UpdateUserDto = {
      name: updateUserDto.name,
      email: updateUserDto.email,
      avatar: updateUserDto.avatar,
    };
    return this.usersService.update(currentUser.id, allowedFields);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }
}
