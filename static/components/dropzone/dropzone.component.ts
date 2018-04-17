import {Component, OnDestroy, OnInit} from "@angular/core";
import {ZipService} from "../../../src/service/zip.service";

@Component({
  selector: 'app-dropzone',
  templateUrl: './dropzone.component.html',
  styleUrls: ['./dropzone.component.css']
})
export class DropzoneComponent implements OnInit, OnDestroy {
  private adjustDropZone: boolean = undefined;
  private validZipSubscription: any;

  constructor(private zipService: ZipService) {}

  onDrop(e: any): void {
    e.preventDefault();
    this.zipService.workOrderDropped();
    this.adjustDropZone = undefined;
  }

  onDragOver(e: any): void {
    e.preventDefault();
  }

  onDragEnter(e: any): void {
    let filePath = e.dataTransfer.files[0].path;
    this.zipService.draggedWorkOrder(filePath);
  }

  onDragLeave(e: any): void {
    this.adjustDropZone = undefined;
  }

  selectWorkOrder(): void {
    this.zipService.selectWorkOrder();
    this.adjustDropZone = undefined;
  }

  ngOnInit(): void {
    this.validZipSubscription = this.zipService.validZip$.subscribe(validity => {
      this.adjustDropZone = validity;
    });
  }

  ngOnDestroy(): void {
    // Prevent memory leaks
    if (this.validZipSubscription != null) this.validZipSubscription.unsubscribe();
  }
}
