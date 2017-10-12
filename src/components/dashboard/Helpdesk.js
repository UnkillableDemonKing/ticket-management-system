import React, { Component } from 'react';
import { apiurl } from '../../helpers/constants';
import { Table, Row, Col, Jumbotron, Button } from 'react-bootstrap';
import './Helpdesk.css'
import firebase from 'firebase';

class Helpdesk extends Component {
    state = {
        tickets: [],
        selectedTicket: null,
        techUsers: [],
        ticketLevel:[],
        selectedTech: null,
        selectedPriority: null,
        selectedEscalation: null
    }

    /* Once component has mounted, fetch from API + firebase */
    componentDidMount() {
        /* Fetch all tickets and check which tickets have
            an assigned tech
         */
        fetch(apiurl + '/tickets')
            .then((response) => response.json())
            .then((responseJson) => {
                const pendingTickets = [];
                for(const ele in responseJson) {
                    firebase.database().ref('ticket/'+responseJson[ele].id).on('value', (snapshot) => {
                        if(snapshot.val() === null) {
                            pendingTickets.push(responseJson[ele]);

                            /* Force the view to re-render (async problem) */
                            this.forceUpdate();
                        }
                    })
                }
                return pendingTickets;
            })
            .then((tickets) => {
                this.setState({
                    tickets: tickets
                });
            })

        /* Creates a firebase listener which will automatically
            update the list of tech users every time a new tech
            registers into the system
         */
        const users = firebase.database().ref('user/')
        users.on('value', (snapshot) => {
            const tempTech = [];
            for(const ele in snapshot.val()) {
                if(snapshot.val()[ele].type === 'tech') {
                    tempTech.push(snapshot.val()[ele]);
                }
            }
            this.setState({
                techUsers: tempTech
            });
        })
         /* Creates a firebase listener which will automatically
            update the priority and escalation level once its updated
            by user.
         */
        const ticket = firebase.database().ref('ticketData/')
        ticket.on('value', (snapshot) => {
            const tempTicket = [];
            for(const ele in snapshot.val()) {
                tempTicket.push(snapshot.val()[ele]);
            }
            this.setState({
                ticketLevel: tempTicket
            });
        })
    }

    /* Toggle the ticket dialog */
    ticketDetailsClick = (ticket) => {
        const { selectedTicket } = this.state;
        this.setState({
            selectedTicket: (selectedTicket !== null && selectedTicket.id === ticket.id ? null : ticket)
        });
    }
    /*Handle change to the Priority level*/
    handlePriorityChange = (e) => {
        this.setState({
            selectedPriority: e.target.value
        });
    }
    /*Handle change to the escalation level*/
    handleEscalationChange = (e) => {
        this.setState({
            selectedEscalation: e.target.value
        });
    }


    /* Close button for dialog */
    closeDialogClick = () => {
        this.setState({
            selectedTicket: null
        })
    }

    /* Update the selected tech from dropdown box */
    handleTechChange = (e) => {
        this.setState({
            selectedTech: e.target.value
        });
    }

    /* Click assign button */
    assignTicketToTech = () => {
        if(this.state.selectedTech === null) {
            return;
        }

        /* Add assigned ticket+tech into database*/
        const data = {};
        data['ticket/' + this.state.selectedTicket.id] = {
            ticket_id: this.state.selectedTicket.id,
            user_id: this.state.selectedTech // stored Tech ID
        };
        firebase.database().ref().update(data)
        alert('Tech successfully assigned to ticket!');
        window.location.reload();
    }
    
    /* Update the ticket escalation level and Priority*/
    updateDetailsClick = (ticket) => {
        const {selectedEscalation, selectedPriority } = this.state;
        this.setState({
             selectedPriority: (selectedPriority !== null),
             selectedEscalation:(selectedEscalation !== null)
        });
        if(this.state.selectedPriority === null) {
            return;
        }else{
            //update the status of the ticket
            const data = {
                ticket_id: this.state.selectedTicket.id,
                Priority: this.state.selectedPriority, // store priority
                Escalation: this.state.selectedEscalation, // store escalation level
            };
            const url = '?id='+data.ticket_id+'&escalation='+data.Escalation+'&priority='+data.Priority; 
            // Using fetch to update the tickets by checking the api response and then making the 
            // PUT call as a response
            fetch(apiurl + '/updateTicket', {
                method: 'OPTIONS',
            })
            .then(reponse => {
                return fetch(apiurl + '/updateTicket'+url,{
                  method: 'PUT',
                }).then(response => {
                    alert('Ticket Updated successfully', data);
                    window.location.reload();
                })
            }).catch(err => {
                alert('request failed', err);
            });
            //
        }

    }
    /* Render the page! */
    render () {
        const vm = this
        const { selectedTicket, tickets, techUsers } = this.state
        const style = { color: 'white' };
        return (
              
            <div>
                <Row>
                    <Col md={12}>
                        <h1 style={style}>Pending Tickets</h1>
                        {tickets.length < 1 && (
                            <p className="alert alert-info">There are no tickets to display.</p>
                        )}
                        <Table striped hover >
                            <thead>
                            <tr >
                                <th>ID</th>
                                <th>Date</th>
                                <th>Title</th>
                                <th>Operating system</th>
                                <th>Priority</th>
                                <th>Escalation</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tickets.map((ticket, i) => (
                                <tr key={i} >
                                    <td>{ticket.id}</td>
                                    <td>{ticket.created_at}</td>
                                    <td>{ticket.software_issue}</td>
                                    <td>{ticket.operating_system}</td>
                                    <td>{ticket.priority}</td>
                                    <td>{ticket.escalation_level}</td>
                                    <td>
                                        <Button  bsSize="large" bsStyle={vm.state.selectedTicket !== null && vm.state.selectedTicket.id === ticket.id ? 'success' : 'info'} onClick={() => vm.ticketDetailsClick(ticket)}>More Details</Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </Col>
                    {selectedTicket !== null && (
                    <Col md={12}>
                        <Jumbotron style={{padding: 0}}>
                            <Button block bsStyle="danger" onClick={this.closeDialogClick}>Close Dialog</Button>
                            <h3 className="text-uppercase">Ticket Details</h3>
                            <p><b>ID: </b>{selectedTicket.id}</p>
                            <p><b>Status: </b><br/>{selectedTicket.status}</p>
                            <p><b>Comment: </b><br/>{selectedTicket.comments[0].Comment}</p>
                            {techUsers.length > 0 && (
                                <div>
                                    <hr/>
                                    <h3 className="text-uppercase">Assign to tech</h3>
                                    <select className="form-control" onChange={this.handleTechChange} defaultValue="-1">
                                    <option value="-1" defaultValue disabled>Select a tech user</option>
                                    {techUsers.map((user, i) => (
                                        <option key={i} value={user.id}>{user.name}</option>
                                    ))}
                                    </select>

                                    <div className="clearfix"><br/>
                                        <Button  className="pull-right" bsSize="large"  bsStyle="success" onClick={this.assignTicketToTech}>Assign</Button>
                                    </div>
                                </div>
                                )
                            }
                            <h3 className="">OR</h3>
                            <div>
                                 <h3 className="">Update Ticket</h3>
                                  <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>Priority</th>
                                            <th>Escalation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <select  className="form-control" onChange={this.handlePriorityChange}>
                                                  <option>Select a Priority</option>
                                                  <option value="Low">Low</option>
                                                  <option value="Moderate">Moderate</option>
                                                  <option value="High">High</option>
                                                </select>
                                            </td>
                                            <td>
                                                <select className="form-control" onChange={this.handleEscalationChange}>
                                                  <option>Select a level</option>
                                                  <option value="1">1</option>
                                                  <option value="2">2</option>
                                                  <option value="3">3</option>
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                                <div className="clearfix"><br/>
                                        <Button  bsSize="large" className="pull-right"  bsStyle="success" onClick={() => vm.updateDetailsClick(selectedTicket)} >Update Ticket</Button>
                                </div>
                            </div>
                        </Jumbotron>
                    </Col>
                    )}
                </Row>
            </div>
        );
    }
}

export default Helpdesk;