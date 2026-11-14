import { Config } from '@remotion/cli/config';

// טקסט עברי דק: JPEG באיכות גבוהה לכל פריים, ו-H.264 עם CRF נמוך כדי שהטקסט יישאר חד גם אחרי דחיסה של וואטסאפ.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(94);
Config.setCodec('h264');
Config.setCrf(20);
Config.setPixelFormat('yuv420p');
Config.setEntryPoint('src/index.ts');
