import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  OnChanges,
  OnInit,
  Output
} from "@angular/core";
import { NgControl } from "@angular/forms";
import { AccessControlService } from "./acess-control.service";

@Directive({
  selector: "[tcAccessControl]"
})
export class AccessControlDirective
  implements OnInit, AfterViewInit, OnChanges {
  @Input() defaultDisabledCondition = false;
  @Input() inverse = false;

  // use this for explicitly hide
  // can include hide | click
  @Input() overrideActions = [];
  // todo implement permissions by using this input
  // @Input() permCodes: string | string[];

  @Output() click: EventEmitter<any> = new EventEmitter();

  private readonly = true;
  private notified = false;

  private control: NgControl;

  private overrideActionsMap = new Map<string, OverrideOperation>();

  constructor(
    private injector: Injector,
    private accessControlService: AccessControlService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.overrideActionsMap.set(
      OVERRIDE_ACTIONS.HIDE,
      new OverrideOperation(
        ACCESS_CONTROL_OPERATION.UNHIDE,
        ACCESS_CONTROL_OPERATION.HIDE
      )
    );
    this.overrideActionsMap.set(
      OVERRIDE_ACTIONS.CLICK,
      new OverrideOperation(
        ACCESS_CONTROL_OPERATION.ADD_CLICK,
        ACCESS_CONTROL_OPERATION.REMOVE_CLICK
      )
    );
  }

  ngOnChanges() {
    if (this.notified) {
      this.updateView(this.isReadOnly());
    }
  }

  ngAfterViewInit(): void {
    this.accessControlService.restrictAll.subscribe(data => {
      this.readonly = data;
      this.notified = true;
      console.log(data);
      this.updateView(this.isReadOnly());
    });
  }

  updateView(disable) {
    // console.log(this.elementRef);
    this.handleComponents(disable);
    this.handleOverrideActions(disable);
  }

  handleComponents(disable) {
    if (disable) {
      this.disableComponents();
    } else {
      this.enableComponents();
    }
  }

  handleOverrideActions(disable) {
    if (this.overrideActions && this.overrideActions.length > 0) {
      this.overrideActions.forEach(action => {
        if (typeof action === "string") {
          action = OVERRIDE_ACTIONS[action];
        }
        const overrideOperation: OverrideOperation = this.overrideActionsMap.get(
          action
        );
        if (disable) {
          this.handleActions([overrideOperation.disableAction]);
        } else {
          this.handleActions([overrideOperation.enableAction]);
        }
      });
    }
  }

  disableComponents() {
    // if some case added make sure to implement enabling as well in enableComponents()
    switch (this.elementRef.nativeElement.tagName) {
      // we will add two directives
      case "MAT-FORM-FIELD":
        this.handleActions([ACCESS_CONTROL_OPERATION.ADD_READ_ONLY_CLASS]);
        break;
      case "MAT-SELECT":
      case "MAT-SLIDE-TOGGLE":
      case "MAT-SELECTION-LIST":
      case "MAT-CHECKBOX":
      case "MAT-BUTTON-TOGGLE-GROUP":
      case "INPUT":
      case "TEXTAREA":
        this.handleActions([
          ACCESS_CONTROL_OPERATION.CONTROL_DISABLE,
          ACCESS_CONTROL_OPERATION.ADD_READ_ONLY_CLASS
        ]);
        break;
      case "BUTTON":
      case "MAT-ICON":
        this.handleActions([
          ACCESS_CONTROL_OPERATION.HIDE,
          ACCESS_CONTROL_OPERATION.REMOVE_CLICK
        ]);
        break;
      case "MAT-ROW":
      case "TR":
      case "DIV":
        this.handleActions([
          ACCESS_CONTROL_OPERATION.REMOVE_CLICK,
          ACCESS_CONTROL_OPERATION.ADD_READ_ONLY_CLASS
        ]);
        break;
      default:
        this.handleActions([ACCESS_CONTROL_OPERATION.ADD_READ_ONLY_CLASS]);
    }
  }

  enableComponents() {
    switch (this.elementRef.nativeElement.tagName) {
      case "MAT-FORM-FIELD":
        this.handleActions([ACCESS_CONTROL_OPERATION.REMOVE_READ_ONLY_CLASS]);
        break;
      case "MAT-SELECT":
      case "MAT-SLIDE-TOGGLE":
      case "MAT-SELECTION-LIST":
      case "MAT-CHECKBOX":
      case "MAT-BUTTON-TOGGLE-GROUP":
      case "INPUT":
      case "TEXTAREA":
        this.handleActions([
          ACCESS_CONTROL_OPERATION.CONTROL_ENABLE,
          ACCESS_CONTROL_OPERATION.ADD_READ_ONLY_CLASS
        ]);
        break;
      case "BUTTON":
      case "MAT-ICON":
        this.handleActions([
          ACCESS_CONTROL_OPERATION.UNHIDE,
          ACCESS_CONTROL_OPERATION.ADD_CLICK
        ]);
        break;
      case "MAT-ROW":
      case "DIV":
      case "TR":
        this.handleActions([ACCESS_CONTROL_OPERATION.ADD_CLICK]);
        break;
      default:
        this.handleActions([ACCESS_CONTROL_OPERATION.REMOVE_READ_ONLY_CLASS]);
      // this.elementRef.nativeElement.classList.remove('tc-read-only');
    }
  }

  handleActions(actions: ACCESS_CONTROL_OPERATION[] | string[]) {
    if (actions && actions.length > 0) {
      actions.forEach(action => {
        if (typeof action === "string") {
          action = ACCESS_CONTROL_OPERATION[action];
        }
        switch (action) {
          case ACCESS_CONTROL_OPERATION.ADD_READ_ONLY_CLASS:
            this.elementRef.nativeElement.classList.add("tc-read-only");
            break;
          case ACCESS_CONTROL_OPERATION.REMOVE_READ_ONLY_CLASS:
            this.elementRef.nativeElement.classList.remove("tc-read-only");
            break;
          case ACCESS_CONTROL_OPERATION.HIDE:
            this.elementRef.nativeElement.classList.add("hide");
            break;
          case ACCESS_CONTROL_OPERATION.UNHIDE:
            this.elementRef.nativeElement.classList.remove("hide");
            break;
          case ACCESS_CONTROL_OPERATION.ADD_CLICK:
            this.elementRef.nativeElement.removeAllListeners("click");
            // this is assuming $event is not used in button click
            this.elementRef.nativeElement.addEventListener("click", () => {
              this.click.emit();
            });
            break;
          case ACCESS_CONTROL_OPERATION.REMOVE_CLICK:
            this.elementRef.nativeElement.removeAllListeners("click");
            break;
          case ACCESS_CONTROL_OPERATION.CONTROL_DISABLE:
            this.control = this.injector.get(NgControl);
            setTimeout(() => {
              this.control.control.disable();
            }, 0);
            this.control.control.enable();
            break;
          case ACCESS_CONTROL_OPERATION.CONTROL_ENABLE:
            this.control = this.injector.get(NgControl);
            this.control.control.enable();
            break;
        }
      });
    }
  }

  private isReadOnly() {
    // this is similar to XOR will inverse the value of readOnly
    return this.readonly !== this.inverse || this.defaultDisabledCondition;
  }
}

export enum ACCESS_CONTROL_OPERATION {
  ADD_READ_ONLY_CLASS = "ADD_READ_ONLY_CLASS",
  REMOVE_READ_ONLY_CLASS = "REMOVE_READ_ONLY_CLASS",
  HIDE = "HIDE",
  UNHIDE = "UNHIDE",
  ADD_CLICK = "ADD_CLICK",
  REMOVE_CLICK = "REMOVE_CLICK",
  CONTROL_DISABLE = "CONTROL_DISABLE",
  CONTROL_ENABLE = "CONTROL_ENABLE"
}

// this will override behavior existing ACCESS_CONTROL_OPERATION s and add new ones
export enum OVERRIDE_ACTIONS {
  HIDE = "hide",
  CLICK = "click"
}

export class OverrideOperation {
  enableAction: ACCESS_CONTROL_OPERATION;
  disableAction: ACCESS_CONTROL_OPERATION;

  constructor(
    enableAction: ACCESS_CONTROL_OPERATION,
    disableAction: ACCESS_CONTROL_OPERATION
  ) {
    this.enableAction = enableAction;
    this.disableAction = disableAction;
  }
}
