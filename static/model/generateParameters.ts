import {CustomImage} from "./customImage";
import {CustomString} from "./customString";
export class GenerateParameters {
  urlPrefix: string;
  outputPath: string;
  dpi: number;
  subDirSplitCount: number;
  shouldArchive: boolean;
  placeholderCells: number;
  cellSizeInPx: number;
  shouldAddWhiteSpaceBorder: boolean;
  customStrings: CustomString[];
  customImage: CustomImage;
  outputFormat: string; // TIFF/PNG
  physicalSizeInCm: number;
  workOrderType: string;
  generateNCodes: number;
}
