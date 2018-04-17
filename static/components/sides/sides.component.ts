import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/observable/timer';

@Component({
  selector: 'app-sides',
  templateUrl: './sides.component.html',
  styleUrls: ['./sides.component.css']
})
export class SidesComponent {
  private _show: boolean;
  private appendElement: boolean;
  private cursorHovering: boolean;
  private selectedOrientation: number;

  @Input()
  set show(visible: boolean) {
    this.appendElement = visible;
    this._show = visible;
    // if (visible)
    //   this.mouseOffComponent();
  }

  @Input()
  set currentOrientation(or: number) {
    this.selectedOrientation = or;
  }

  @Output() orientation = new EventEmitter();

  selectedSide(orientation: number): void {
    this.orientation.emit(orientation);
    this.selectedOrientation = orientation;
  }

  // private startFadeOut(): void {
  //   // wait x seconds before switching class (which triggers CSS3 transformation, duration 500ms)
  //   // after 600ms, the sides element is hidden from the DOM so no unintended interaction is possible.
  //   let timer = Observable.timer(2000);
  //   timer.subscribe(() => {
  //     if (!this.cursorHovering) {
  //       this._show = false;
  //       let removeTimer = Observable.timer(600);
  //       removeTimer.subscribe(() => {
  //         this.appendElement = false;
  //       });
  //     }
  //   });
  // }
  //
  // mouseOnComponent(): void {
  //   this.cursorHovering = true;
  // }
  //
  // mouseOffComponent(): void {
  //   this.cursorHovering = false;
  //   this.startFadeOut();
  // }

}
