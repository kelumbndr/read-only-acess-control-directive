import { Injectable } from "@angular/core";
import { BehaviorSubject, Subscription } from "rxjs";

@Injectable()
export class AccessControlService {
  public restrictAll: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() {}
}
