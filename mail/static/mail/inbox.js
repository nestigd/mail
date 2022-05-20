// Event listener calls function when DOM is ready
document.addEventListener('DOMContentLoaded', function() {

    // By default, load the inbox
  load_mailbox('inbox');

  // Event listeners: when buttons are clicked, load the corresponding mailbox
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  // Event listener: Add new email to database
  const form = document.querySelector('#compose-form');
  form.addEventListener('submit', submit_email);
});

// Handle pop state (history arrows)
window.onpopstate = function(event) {
  
  // in case there is no email in the state, load the inbox
  if (event.state == null || event.state == undefined || event.state == "") {
    load_mailbox('inbox');
  } 
  // else, load the previous email.
  else {
    view_email(Email_memory[event.state]);
  }
}



// - - - - -  - - - - - - - - - - - - - - - - DECLARATIONS  - - - - - - - - - - - - - - - - - - - - - - - - -

// load the parsed mailbox
function load_mailbox(mailbox) {
  
  const blank = "";
  history.pushState(blank, "", "./");
  
  // Show the mailbox view and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';

  // This global obj will cache requested emails. It gets reset every time new emails are fetched.
  Email_memory = {};
  
  // Show the mailbox name <h3> and get rid of child elements if already present
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET emails:
  // get emails from a particular mailbox as JSON data
  fetch(`emails/${mailbox}`)
  .then(response => response.json())

  // iterate through email objects and call function to create new divs while saving the emails to cache.
  .then(data => {
    data.forEach(newdiv, this);
    console.log(Email_memory);
  })

  // catch exceptions and manage
  .catch(error => {alert (error); console.log(error);});
}


function newdiv (email) {

  // save this email for future reading without having to fetch it again.
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



function view_email(email) {

  console.log(email.body);

  document.querySelector('#read-body').innerHTML = `${email.body}`;
  document.querySelector('#read-subject').innerHTML = `${email.sender}: ${email.subject}`;
  document.querySelector('#read-timestamp').innerHTML = `read: ${email.read}; ${email.timestamp}`;

  document.querySelector('#read-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
};

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
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