var q = "";

//TODO: move glossary resource from the JSON document

// DOCUMENT LISTENERS	
document.querySelector("#search-term").addEventListener("submit", function(e){
	    console.log("page-actions pressed SUBMIT");
        e.preventDefault();    //stop form from submitting
        q = document.querySelector("#query").value;
		if(q.length > 0) {
			var res = "";
			
			//get information from ackend
			chrome.runtime.sendMessage({
				message: "get_term",
				query: q		
				},  response => {
					printTermInfo(response.payload);
			});
			
			document.getElementById('answer').innerHTML = q;
		}
});

// Format response into web represeantation 
function printTermInfo(JSON_data){
	    console.log("JSON: " + JSON_data);
		if(typeof JSON_data === 'object'){
			//TODO: add this information to DIV parse JSON and create DIV structure
			
			if(JSON_data.length > 0){
				document.getElementById("glossary-info").innerHTML = "";
								
				for (var i = 0; i < JSON_data.length; i++){
					const ce_element_container = document.createElement('DIV');
					ce_element_container.classList.add('ce_term_info');
					
					//get dictionary keys and iterate throuhg them
					for(var key in JSON_data[i]) {
						const ce_element = document.createElement('P')
						ce_element.id = key; 
						ce_element.innerHTML = "<b>"+ key +": </b> " //add prefix
						if(typeof JSON_data[i][key] === 'object') {
							ce_element.innerHTML += JSON.stringify(JSON_data[i][key], undefined, 2); //nested value
						}else{
							ce_element.innerHTML += JSON_data[i][key]; //simple value					
						}
						ce_element_container.appendChild(ce_element);						 
					}
					document.getElementById("glossary-info").appendChild(ce_element_container);
				}
				
			} else {
				document.getElementById("glossary-info").innerHTML = "Term not found in glossary";
			}
			
		}
}
