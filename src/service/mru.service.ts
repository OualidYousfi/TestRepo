import {Injectable, NgZone} from "@angular/core";
import {ipcRenderer} from 'electron';
import {Subject} from "rxjs/Subject";

@Injectable()
export class MruService {
  private mruList = new Subject<Array<string>>();
  $mruList = this.mruList.asObservable();


  constructor(zone: NgZone) {
    ipcRenderer.on('mru-list', (event, mru) => {
      zone.run(() => {
        this.mruList.next(mru);
      });
    });
  }

  public getMru(): void {
    ipcRenderer.send('get-mru');
  }
}
