import { Component, VERSION } from "@angular/core";
import { AccessControlService } from "./acess-control.service";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  name = "Angular 10 " + VERSION.major;

  public enable = false;

  constructor(private accessControlService: AccessControlService) {}

  onEnableClick() {
    this.enable = !this.enable;
    this.accessControlService.restrictAll.next(this.enable);
  }

  buttonClicked() {
    console.log("Button clicked");
  }
}
