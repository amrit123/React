import React from 'react';

import { Button } from 'react-bootstrap';
import { CreateStore } from 'redux';
import Request from 'superagent'
import btoa from 'btoa'
import $ from 'jquery'

class App extends React.Component {

    constructor() { //class constructor
        super();
        this.state = {
            settings: "jeg ereee svampebob"
        };

    }

    clicked(innnn) {
        var auth = btoa('admin:district');

        var settings = {
            "url": "https://play.dhis2.org/demo/api/resources.json",
            "method": "GET",
            "headers": {
                "content-type": "application/json",
                "authorization": "Basic " + auth
            }
        };

        $.ajax(settings).done((response) => {

            console.log(response.resources);
            this.setState({settings : response.resources[0].displayName});

        });





    }



    render() {
        return (
            <div className="container-fluid">
                {this.state.settings}
                {this.state.somies}
                <Button bsStyle="primary" bsSize="large" onClick={(e) => { this.clicked("jeg er ikke svampebob") } } >Large button</Button>

            </div>
        );
    }
}

class Header extends React.Component {
    render() {
        return (
            <div>
                <h1>Header</h1>
            </div>
        );
    }
}

class Content extends React.Component {
    render() {
        return (
            <div>
                <h2>Content</h2>
                <p>The content text!!!</p>
            </div>
        );
    }
}

class Footer extends React.Component {
    render() {
        return (
            <div>
                <h2>I am the footer</h2>
            </div>
        );
    }
}

export default App;