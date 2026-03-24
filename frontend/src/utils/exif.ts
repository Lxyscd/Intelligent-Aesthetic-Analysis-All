import EXIF from 'exif-js';
import { ExifData } from '../types';

export const extractExif = (file: File): Promise<ExifData | null> => {
  return new Promise((resolve) => {
    EXIF.getData(file as any, function(this: any) {
      const allMetaData = EXIF.getAllTags(this);
      if (!allMetaData || Object.keys(allMetaData).length === 0) {
        resolve(null);
        return;
      }

      const data: ExifData = {
        make: allMetaData.Make,
        model: allMetaData.Model,
        exposureTime: allMetaData.ExposureTime ? 
          (allMetaData.ExposureTime < 1 ? `1/${Math.round(1/allMetaData.ExposureTime)}` : allMetaData.ExposureTime.toString()) : 
          undefined,
        fNumber: allMetaData.FNumber?.toString(),
        iso: allMetaData.ISOSpeedRatings?.toString(),
        focalLength: allMetaData.FocalLength?.toString(),
        dateTime: allMetaData.DateTime,
      };
      resolve(data);
    });
  });
};
