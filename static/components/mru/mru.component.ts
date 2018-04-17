import {Component, OnInit} from "@angular/core";
import {MruService} from "../../../src/service/mru.service";
import {ZipService} from "../../../src/service/zip.service";

@Component({
  selector: 'app-mru',
  templateUrl: './mru.component.html',
  styleUrls: ['./mru.component.css']
})
export class MruComponent implements OnInit {
  private mruSubscription: any;
  private mruList = [];

  constructor(private mruService: MruService, private zipService: ZipService) {}

  ngOnInit(): void {
    this.mruService.getMru();
    this.mruSubscription = this.mruService.$mruList.subscribe(mruList => {
      this.mruList = mruList;
    });
  }

  selectEntry(path: string): void {
    this.zipService.recentWoSelected(path);
  }

}
