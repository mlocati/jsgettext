1. Install the required Composer dependencies  
  `cd bin && composer install && cd ..`  

2. Install the required Node dependencies  
  `npm install`  

3. Generate the data about plural rules  
   `bin/vendor/bin/export-plural-rules --reduce=yes --output=bin/cldr/plurals.json prettyjson`  

4. Format the data about plural rules  
   `node bin/cldr-processor.js`
   
5. Build the CSS  
   `npm run build-css`  

5. Build the JavaScript  
   `npm run build-js`  
