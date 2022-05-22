
// MAIN CODE
// This event listener waits for the DOM to be fully loaded
// before any functions get called
document.addEventListener('DOMContentLoaded', function() {

    // By default, call function to load the inbox
  load_mailbox('inbox');

  // Event listeners: all sections at the top of the page: inbox, sent, archive load the corresponding mailbox
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  
  // Event listener: go to compose mail mode
  document.querySelector('#compose').onclick = compose_email;
  
  // Event listener: call function to submit the new email and save into the database.
  document.querySelector('#compose-form').addEventListener('submit', submit_email);
});

// Handle history popstate.
window.onpopstate = function(event) {
  
  // in case the url contains no specific information, load the inbox
  if (event.state == null || event.state == undefined || event.state == "") {
    load_mailbox('inbox');
  } 
  // in case the event.state contains an email id, this must be a non negative number
  else if (event.state >= 0){
    view_email(Email_memory[event.state]);
  }
  else{
    //throw an alert in case something goes wrong.
    alert("error when handling popstate");
  }
}



// - - - - -  - - - - - - - - - - - - - - - - DECLARATIONS  - - - - - - - - - - - - - - - - - - - - - - - - -

// load the parsed mailbox in memory, then call a function to display these emails in separate divs.
function load_mailbox(mailbox) {
  
  // When loading a mailbox, push empty state to history. We are resetting the to an empty string in case 
  // any emails have been viewed and for this reason there is information in the url already
  const blank = "";
  history.pushState(blank, "", "./");
  
  // Show the mailbox view and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';

  // This global obj will keep a bunch of emails in memory. 
  // I decided to fetch them once every time we call for a mailbox...
  // not every time I need to read a single email
  Email_memory = {};
  
  // Show the mailbox name <h3> and get rid of child elements if already present
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET emails:
  // get emails for this mailbox as JSON data
  fetch(`emails/${mailbox}`)
  .then(response => response.json())

  // iterate through email objects and call function to CREATE NEW DIVS while saving the emails to cache.
  .then(data => {
    data.forEach(makeEmailDiv, this);
    console.log(Email_memory);
  })
  // catch exceptions and show me what happened.
  .catch(error => {alert (error); console.log(error);});
}



// the email will be displayed as a DIV containing a Button. 
// The button calls a function to display its email when clicked.
function makeEmailDiv (email) {

  // use the previously declared Email_memory object to keep the emails cached.
  let id = email.id
  Email_memory[id] = email;


  // create parent DIV
  const element = document.createElement('div');

  // create child button
  const child = document.createElement('button');
  child.className += "btn btn-light"; 
  child.innerHTML = `<p>from: ${email.sender} - ${email.read} - ${email.timestamp}</p> <i>${email.subject}</i> `;
  child.dataset.email_id = email.id;

  //add event listeners on each new email loaded to call the VIEW EMAIL function
  child.onclick = function(){
    
    //update history
    history.pushState(this.dataset.email_id, "", `read${this.dataset.email_id}`);
    
    // after displaing email... check if it is unread and mark as read. Else do nothing.
    if (Email_memory[id].read == false) {
      fetch (`emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({'read':'True'})
      })
      .then(response => {
          console.log(response)
        })
    }
    
    // call function to view email
    view_email(Email_memory[id]);

  };

  // append btn to div and then that div to container div
  element.append(child);
  document.querySelector('#emails-view').append(element);
}


// Function to hide all non relevant content and display the contents of the email
// including buttons to archive, unarchive and to reply.
function view_email(email) {

  // populate every field with the email data  
  document.querySelector('#read-body').innerHTML = `${email.body}`;
  document.querySelector('#read-subject').innerHTML = `${email.sender}: ${email.subject}`;
  document.querySelector('#read-timestamp').innerHTML = `read: ${email.read}; ${email.timestamp}`;

  // create archive button
  const archiveBtn = document.createElement('button');
  archiveBtn.className = 'btn btn-secondary';
  archiveBtn.id = 'archiveBtn';
  archiveBtn.dataset.email_id = email.id;
  
  // onclick event listener
  console.log(`email.archived: ${email.archived}`);

  //change the "archive or unarchive" button depending on the current status
    // in case already archived, show me a button to unarchive
  if (email.archived == true){
    
    // set the text inside the button
    archiveBtn.innerHTML = 'unarchive';
    
    // give onclick property
    archiveBtn.onclick = function () {
      
      // function to change the archived property to 
      archive_email(email, false);
      
      // go back to the inbox
      load_mailbox('inbox');
    }

    // exactly as above but for the opposite condition....
  } else if (email.archived == false){

    archiveBtn.innerHTML = 'archive';

    archiveBtn.onclick = function () {
    archive_email(email, true);

    load_mailbox('inbox');
    };
  } 
  
  // change placeholder button to newly created button.
  let placeholder = document.querySelector('#archive');
  placeholder.replaceWith(archiveBtn);
  document.querySelector('#archiveBtn').id = 'archive';

 
  // create reply button
  const replyBtn = document.createElement('button');
  replyBtn.className = 'btn btn-primary';
  replyBtn.innerHTML = 'Reply';
  replyBtn.id = 'replyBtn';
  replyBtn.dataset.email_id = email.id;
  replyBtn.onclick = function (){
    compose_email(email);
  };

  // replace placeholder HTML with created button
  let placeholder2 = document.querySelector('#reply');
  placeholder2.replaceWith(replyBtn);
  document.querySelector('#replyBtn').id = 'reply';


  // hide non relevant sections and sow email
  document.querySelector('#read-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  
};


function archive_email (email, bool){

  // check if the function will archive or unarchive the email.
  // will be archived if true, otherwise it will be unarchived.
  let content = 'Blank content';
  
  if (bool == true){
    content = 'True';
  }else{
    content = 'False';
  }

  // test string
  console.log(`contenuto da inviare al server da archive_email: ${email.id} , content debug. ${content}`);

  // fetch: PUT request
  fetch (`emails/${email.id}`, {
    method: 'PUT',
    body: JSON.stringify({'archived': content})
  })
  .then(response => {
      console.log(response)
      
    })
}


function compose_email(email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = ' ';
    document.querySelector('#compose-subject').value = ' ';
    document.querySelector('#compose-body').value = ' ';
   
     
  // when an argument is received, pre-populate the email 
  // body with the data of the email we are replying to.
  if (typeof email.body !== 'undefined'){
    document.querySelector('#compose-recipients').value = `${email.sender}`
    document.querySelector('#compose-subject').value = `RE: ${email.subject}`;
    document.querySelector('#compose-body').value = `\n ${email.sender} wrote on day ${email.timestamp}:\n ${email.body}`;
  }

}


function submit_email(event){

  // store sender, recipients, subject and body into an object.
  let payload = {
    "sender" : document.querySelector('#compose-sender').value,
    "recipients" : document.querySelector('#compose-recipients').value,
    "subject" : document.querySelector('#compose-subject').value,
    "body" : document.querySelector('#compose-body').value
  };

  // send POST request to /emails API route
  fetch("emails", {
    method : 'post',
    body : JSON.stringify(payload)
  })
  // handle response
  .then(response => response.text())
  .then(text => {
      // Log text and display on page
      console.log(text);
      alert(text);
  })
  .catch((error) => {
    console.log(error);
    alert("UNUSUAL ERROR: check console");
  });

  // load inbox again
  load_mailbox('inbox');
 
  return false;
};

