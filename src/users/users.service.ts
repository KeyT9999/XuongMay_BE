import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    const userDto = this.toDto(savedUser);
    
    // Send welcome email (async, don't block)
    this.emailService.sendWelcomeEmail(userDto, createUserDto.password).catch((error) => {
      console.error('Failed to send welcome email:', error);
    });
    
    return userDto;
  }

  async findAll(): Promise<UserDto[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.toDto(user));
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toDto(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    // #region agent log
    const fs = require('fs');
    const logPath = 'e:\\QuanLyXuongMay\\.cursor\\debug.log';
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'users.service.ts:findByUsernameOrEmail',message:'findByUsernameOrEmail called',data:{identifier:identifier?identifier.substring(0,3)+'***':null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    } catch(e) {}
    // #endregion
    // Try to find by username first, then by email
    const user = await this.userModel.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    }).exec();
    // #region agent log
    try {
      fs.appendFileSync(logPath, JSON.stringify({location:'users.service.ts:findByUsernameOrEmail',message:'findByUsernameOrEmail result',data:{userFound:!!user,userId:user?._id?.toString(),username:user?.username,email:user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n');
    } catch(e) {}
    // #endregion
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const oldUser = await this.userModel.findById(id).exec();
    if (!oldUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Prepare update data
    const updateData: any = { ...updateUserDto };

    // Hash password if provided
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    } else {
      // Remove password from updateData if not provided
      delete updateData.password;
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    ).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    const userDto = this.toDto(user);
    
    // Track changes for email notification
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    if (updateUserDto.name && oldUser.name !== updateUserDto.name) {
      changes.push({ field: 'Họ và Tên', oldValue: oldUser.name, newValue: updateUserDto.name });
    }
    if (updateUserDto.email && oldUser.email !== updateUserDto.email) {
      changes.push({ field: 'Email', oldValue: oldUser.email, newValue: updateUserDto.email });
    }
    if (updateUserDto.role && oldUser.role !== updateUserDto.role) {
      changes.push({ field: 'Chức vụ', oldValue: oldUser.role, newValue: updateUserDto.role });
    }
    if (updateUserDto.password) {
      changes.push({ field: 'Mật khẩu', oldValue: '***', newValue: '***' });
    }
    
    // Send update email if there are changes (async, don't block)
    if (changes.length > 0) {
      this.emailService.sendUpdateEmail(userDto, changes).catch((error) => {
        console.error('Failed to send update email:', error);
      });
    }
    
    return userDto;
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true },
    ).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userDto = this.toDto(user);
    
    // Send delete email before deactivating (async, don't block)
    this.emailService.sendDeleteEmail(userDto).catch((error) => {
      console.error('Failed to send delete email:', error);
    });

    const result = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    ).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async seedDefaultUsers(): Promise<void> {
    const defaultUsers = [
      { username: 'admin', password: 'admin123', name: 'Admin Nguyễn', email: 'admin@xuongmay.com', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin' },
      { username: 'tech', password: 'tech123', name: 'Kỹ Thuật Viên', email: 'tech@xuongmay.com', role: UserRole.TECH, avatar: 'https://i.pravatar.cc/150?u=tech' },
      { username: 'accountant', password: 'acc123', name: 'Kế Toán', email: 'accountant@xuongmay.com', role: UserRole.ACCOUNTANT, avatar: 'https://i.pravatar.cc/150?u=accountant' },
      { username: 'planner', password: 'plan123', name: 'Kế Hoạch', email: 'planner@xuongmay.com', role: UserRole.PLANNER, avatar: 'https://i.pravatar.cc/150?u=planner' },
      { username: 'warehouse', password: 'wh123', name: 'Quản Kho', email: 'warehouse@xuongmay.com', role: UserRole.WAREHOUSE, avatar: 'https://i.pravatar.cc/150?u=warehouse' },
      { username: 'hr', password: 'hr123', name: 'Nhân Sự', email: 'hr@xuongmay.com', role: UserRole.HR, avatar: 'https://i.pravatar.cc/150?u=hr' },
      { username: 'factory', password: 'factory123', name: 'Trưởng Xưởng', email: 'factory@xuongmay.com', role: UserRole.FACTORY_MANAGER, avatar: 'https://i.pravatar.cc/150?u=factory' },
    ];

    for (const userData of defaultUsers) {
      const existingUser = await this.findByUsername(userData.username);
      if (!existingUser) {
        await this.create(userData);
        console.log(`Created user: ${userData.username}`);
      } else {
        console.log(`User ${userData.username} already exists`);
      }
    }
  }

  private toDto(user: User): UserDto {
    return {
      id: user._id.toString(),
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
