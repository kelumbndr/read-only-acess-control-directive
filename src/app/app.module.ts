import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AppComponent } from "./app.component";
import { AccessControlService } from "./acess-control.service";
import { DemoMaterialModule } from "./material.module";
import { AccessControlDirective } from "./access-control.directive";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    DemoMaterialModule,
    ReactiveFormsModule
  ],
  declarations: [AppComponent, AccessControlDirective],
  bootstrap: [AppComponent],
  providers: [AccessControlService]
})
export class AppModule {}
