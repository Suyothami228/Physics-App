// Optional end-to-end local OCR smoke check; language models download on first run.
const {createWorker}=require('tesseract.js');
(async()=>{
  const worker=await createWorker('tam+eng',1,{cachePath:'.npm-cache'});
  try {
    const {data}=await worker.recognize('backend/learning/data/measurement_mcq/q08.png');
    if (!/[\u0B80-\u0BFF]/.test(data.text)) throw new Error('Tamil OCR returned no Tamil text');
    console.log('Tamil photo OCR passed; extracted characters:',data.text.length);
  } finally {await worker.terminate();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
