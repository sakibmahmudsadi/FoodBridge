import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt";
import { UserRole } from "../../common/user-role.enum.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration:false,
            secretOrKey: "test01"
        })
    }

    validate(payload: {
            userId: string;
            userRole: UserRole;
        }) {
        return {
            userId: payload.userId,
            userRole: payload.userRole,
        };
    }


}
