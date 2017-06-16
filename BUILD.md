1. Install the required Node dependencies
  `npm install`
  
2. Build the CSS
  `npm run build-css`
  
3. Build the JavaScript
  `npm run build-js`
  
4. Build the JavaScript while coding
  `npm run watch-js`
  
5. To (re)build the CLDR data:
	1. Install the required Composer dependencies
	  `cd bin && composer install && cd ..`
      
	2. Generate the data about plural rules
	  `bin/vendor/bin/export-plural-rules --reduce=yes --output=bin/cldr/plurals.json prettyjson`
      
	3. Format the data about plural rules
	  `node bin/cldr-processor.js`
