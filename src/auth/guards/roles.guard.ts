import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserDto } from '../../users/dto/user.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: UserDto = request.user;
    return requiredRoles.includes(user.role);
  }
}
