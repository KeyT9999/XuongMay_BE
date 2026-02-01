import { UserDto } from '../../users/dto/user.dto';

export class LoginResponseDto {
  accessToken: string;
  user: UserDto;
}
