import React, { Component } from 'react';
import { EditorState, convertToRaw } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import { Table, Col, Button, Panel, ListGroup, ListGroupItem  } from 'react-bootstrap';
import draftToHtml from 'draftjs-to-html';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { apiurl } from "../../helpers/constants";
import './Tech.css';
import firebase from 'firebase';
import fetch from 'isomorphic-fetch';


class Tech extends Component {
    state = {
        tickets: [],
        statusTicket: null,
        selectedTicket: null,
        escalatationTicket: null,
        selectedProgress: null,
        selectedEscalation: null,
        comment: '',
        editorState: EditorState.createEmpty(),
    }
    
    componentDidMount() {
        /* Fetch all tickets and check which tickets have
            been assigned to this tech user
         */
        fetch(apiurl + '/tickets')
            .then((response) => response.json())
            .then((responseJson) => {
                const myTickets = [];
                for (const ele in responseJson) {
                    firebase.database().ref('ticket/' + responseJson[ele].id).on('value', (snapshot) => {
                        if (snapshot.val() !== null && snapshot.val().user_id === this.props.user.uid) {
                            myTickets.push(responseJson[ele]);

                            /* Force the view to re-render (async problem) */
                            this.forceUpdate();
                        }
                    })
                }
                return myTickets;
            })
            .then((tickets) => {
                this.setState({
                    tickets: tickets
                });
            })
        
    }
    
    /*Setting up WYSIWYG editor*/
    onEditorStateChange = (editorState) => {
        this.setState({
            editorState,
        });
        this.convertHtml(editorState);
    };
    /*Grabbing the content from the editor as HTML*/
    convertHtml = (editorState) => {
        const content = convertToRaw(editorState.getCurrentContent());
        const htmlContent= draftToHtml(content);
        console.log(content)
        console.log(htmlContent)
        this.setState({
                comment: htmlContent
            });
    }

    /* Close button for dialog with escalation level*/
    closeEscalationDialogClick = () => {
        this.setState({
            escalatationTicket: null
        })
    }
    
    closeStatusDialogClick = () => {
        this.setState({
            statusTicket: null
        })
    }
    
    /* Close button for dialog */
    closeDialogClick = () => {
        this.setState({
            selectedTicket: null
        })
    }
    
        /*Handle change to the Progress level*/
    handleProgressChange = (e) => {
        this.setState({
            selectedProgress: e.target.value
        });
    }
    /*Handle change to the escalation level*/
    handleEscalationChange = (e) => {
        this.setState({
            selectedEscalation: e.target.value
        });
    }


    /* Toggle the ticket dialog */
    ticketDetailsClick = (ticket) => {
        const { selectedTicket } = this.state;
        this.setState({
            selectedTicket: (selectedTicket !== null && selectedTicket.id === ticket.id ? null : ticket)
        });
    }

    
    /* Toggle escalation level for ticket*/
    ticketEscalationClick = (ticket) => {
        const {escalatationTicket} = this.state;
        this.setState({
            escalatationTicket: (escalatationTicket !== null && escalatationTicket.id === ticket.id ? null : ticket)
        });
    }
    
        /* Toggle escalation level for ticket*/
    ticketStatusClick = (ticket) => {
        const {ticketStatus} = this.state;
        this.setState({
            ticketStatus: (ticketStatus !== null && ticketStatus.id === ticket.id ? null : ticket)
        });
    }
    
    /*Updates Escalation level of ticket for database via API */
    updateEscalationLevel = (ticket) => {
        
        //Updating the escalation of the ticket 
        const data = {
            ticket_id: this.state.escalatationTicket.id,
            Escalation: this.state.escalatationTicket.escalation_level,
        };
        // Incrementing the level of the tickets 
        var escalataion = data.Escalation;
            if (escalataion == 3){
                alert("Ticket cannot be escalated further! But we will un-assign you from it :)");
                window.location.reload();
                return;
            }else{
                escalataion = +escalataion +1;
                const url = '?id='+data.ticket_id+'&escalation='+escalataion;
                /*Handling the fetch call to the API by following CORS methodology of PUT requests*/
                fetch(apiurl + '/updateEscalation', {
                    method: 'OPTIONS',
                })
                .then(reponse => {
                    return fetch(apiurl + '/updateEscalation'+url,{
                      method: 'PUT',
                      body: '?id='+data.ticket_id+'&escalation='+escalataion
                    }).then(response => {
                        alert('Ticket Escalation Updated successfully', data);
                        window.location.reload();
                    })
                }).catch(err => {
                    alert('request failed', err);
                });

            }
    }
    
    updateStatus = (ticket) => {
        const {selectedProgress} = this.state;
        this.setState({
            selectedProgress:(selectedProgress !== null)
        });
        
        if(this.state.selectedProgress === null){
            return;
        }else{
            //Updating the escalation of the ticket 
            const data = {
                complaint_id: this.state.selectedTicket.id,
                status: this.state.selectedProgress,
            };
            /*Handling the fetch call to the API by following CORS methodology of PUT requests*/
            fetch(apiurl + '/updateStatus', {
                method: 'OPTIONS',
            })
            .then(reponse => {
                return fetch(apiurl + '/updateStatus?id='+data.complaint_id+'&status='+data.status,{
                  method: 'PUT',
                }).then(response => {
                    window.location.reload();
                })
            }).catch(err => {
                alert('request failed', err);
            });
            
        }
    }
    
    
    /*Updates Comments and Status of the ticket for database via API */
    addComments = (ticket) => {
        const {selectedProgress, comment } = this.state;
        this.setState({
            selectedProgress:(selectedProgress !== null),
            comment: (comment !== null),
        });
        
        if(this.state.selectedProgress === null){
            return;
        }else{
            const data = {
                complaint_id: this.state.selectedTicket.id,
                Comment: this.state.comment
            };
            /*Handling the fetch call to the API by following CORS methodology of PUT requests*/
            fetch(apiurl + '/updateComment', {
                method: 'OPTIONS',
            })
            .then(reponse => {
                return fetch(apiurl + '/updateComment',{
                  method: 'PUT',
                    body: JSON.stringify(data),
                    headers: {
                        "Content-Type": "application/json"
                     },
                }).then(response => {
                    alert('Ticket Comment and Status Updated successfully', data);
                    //window.location.reload();
                })
            }).catch(err => {
                alert('request failed', err);
                alert(err);
            });
        }
    }
    /* Click to un-assign button */
    unAssignTicket = (ticket) => {

        /* delete assigned ticket from database*/
        const data = {};
        data['ticket/' + this.state.escalatationTicket.id] = null;
        firebase.database().ref().update(data);
        alert('This ticket has been escalated!');
    }
    

    render() {
        const { editorState, selectedTicket, escalatationTicket ,tickets } = this.state;
        const vm = this
        const vm2 = this
        const style = { color: 'white' };
        return (
            <div>
        <h1 style={style}>My Tickets</h1>
                {tickets.length < 1 ? (
                    <div className="alert alert-info">You have not been assigned any tickets.</div>
                )
                : tickets.map((ticket, i) => (
                    <Panel key={i} header={ticket.id}>
                        <label>Software Issue</label>
                        <p>{ticket.software_issue}</p>
                        <label>Status</label>
                        <p>{ticket.Status}</p>
                        <label>date</label>
                        {ticket.comments.map(comment =>
                            <p><div dangerouslySetInnerHTML={{__html: comment.created_at}}/> 
                            <div dangerouslySetInnerHTML={{__html: comment.Comment}}/></p>
                        )}
                          <Button className="pull-right"bsStyle={vm.state.selectedTicket !== null && vm.state.selectedTicket.id === ticket.id ? 'success' : 'info'} onClick={() => vm.ticketDetailsClick(ticket)}>Add Comment</Button>
                           
                          <Button className="pull-left"  bsStyle={vm2.state.escalatationTicket !== null && vm2.state.escalatationTicket.id === ticket.id ? 'success' : 'warning'} onClick={() => vm2.ticketEscalationClick(ticket) }>Escalate Ticket</Button>
                          
                    </Panel>
                ))}
                   
                   {/* The Dialog box for Adding Tech comments and progress change */}
                  {selectedTicket !== null && (
                  
                       <Panel className="panel panel-primary" header="Add a Comment" style={{padding: 0}}>
                            <div className="panel-body">
                                <h2>Ticket Details</h2>
                                    <ListGroup>
                                         <h4 className="list-group-item-heading">Ticket ID</h4>
                                        <ListGroupItem>{selectedTicket.id}</ListGroupItem>
                                        <h4 className="list-group-item-heading">Status</h4>
                                        <ListGroupItem>{selectedTicket.status}</ListGroupItem>
                                        <h4 className="list-group-item-heading">Comment</h4>
                                        {selectedTicket.comments.map(comment =>
                                            <ListGroupItem><div dangerouslySetInnerHTML={{__html: comment.created_at}}/> 
                                                            <div dangerouslySetInnerHTML={{__html: comment.Comment}}/></ListGroupItem>
                                        )}
                                    </ListGroup>
                                    <Table striped hover>
                                        <thead>
                                            <tr>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <select className="form-control" onChange={this.handleProgressChange}>
                                                      <option>Select the progress</option>
                                                      <option value="Unresolved">Unresolved</option>
                                                      <option value="In Progress">In Progress</option>
                                                      <option value="Resolved">Resolved</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                        <Editor
                                            editorState={editorState}
                                            wrapperClassName="demo-wrapper"
                                            editorClassName="demo-editor"
                                            onEditorStateChange={this.onEditorStateChange}
                                            placeholder="Enter some text..."
                                        />
                                    <div className="clearfix"><br/>
                                        <Button className="pull-right" bsSize="large"  bsStyle="success" onClick={() => {vm.addComments(selectedTicket); vm.updateStatus(selectedTicket)}} >Submit Comment</Button>
                                    </div>
                                </div>
                                 <div className="panel-footer"><Button block bsStyle="danger" bsSize="large" onClick={this.closeDialogClick}>Close Dialog</Button></div>
                 
                        </Panel>
                    )}
                   {/* Dialog box for changing escalation level */} 
                    {escalatationTicket !== null && (  
                        <Col md={12}>
                        <Panel className="panel panel-primary" header="Escalation level" style={{padding: 0}}>
                             <div className="panel-body">
                                     <ListGroup>
                                         <h4 className="list-group-item-heading">Ticket ID</h4>
                                         <ListGroupItem>{escalatationTicket.escalation_level}</ListGroupItem>
                                    </ListGroup>
                                                                                                    
                                    <Button className="pull-right"  bsStyle="success" onClick={() => {vm2.updateEscalationLevel(selectedTicket); vm2.unAssignTicket(selectedTicket)}} >Update Ticket</Button>
                            </div>
                            <div className="panel-footer"> <Button block bsStyle="danger" onClick={this.closeEscalationDialogClick}>Close Dialog</Button></div>
                       </Panel>
                        </Col>
                    )}
      </div>
        );
    }
}


export default Tech;
