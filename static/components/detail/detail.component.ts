import {Component, OnInit} from "@angular/core";
import {MainService} from "../../../src/service/main.service";

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {
  private manifest: any;
  private fileName: string;

  constructor(private mainService: MainService) {}

  ngOnInit(): void {
    this.manifest = this.mainService.getManifest();
    this.fileName = this.mainService.getWorkOrderUrl().split("/").pop();
  }

  showHome(): void {
    this.mainService.showLanding();
  }
}
