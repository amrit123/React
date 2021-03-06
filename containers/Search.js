import { Button,Table,Navbar,Nav,NavItem,Form,ControlLabel, NavDropdown, FormGroup,FormControl, NavbarBrand, MenuItem, DropdownButton, Well, Panel, ButtonGroup, hr} from 'react-bootstrap';
import React from 'react'
import ReactDOM from 'react-dom';
import {bindActionCreators} from 'redux'
import {connect} from 'react-redux'
import jquery from 'jquery'
import loadGoogleMapsAPI from 'load-google-maps-api';
import {recievedOrganisations, fetchOrganisations, findMatchingElements, getLocation, changeLevel, showAddOrgModal, showDistrictBorder, showChiefdomBorder, showNoBorder, createChildPolygon, updateSearch, addNewOganisationUnit, editOganisationUnit, updateCurrentOrg, showChangeOrgModal} from '../actions/actions'
import List from './List';

var markerImg = 'marker.png';
var map;

// Temp storage for map elements, so they can easiliy be shown or hidden
var chiefdomPolygons = [];
var districtPolygons = [];
var singlePolygons = [];
var singleMarkers =[];

/*
Component for the live search part of the application 
*/
class Search extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            isLoading: true
        };
    }

    componentDidMount(){

        // Options for the Google Maps API
        var gooogleOptions ={
            key: "AIzaSyDtsokboJ-exluz1PyeU6YrsEAoQSRvaDo"
        }

        // Load the Google Maps script
        loadGoogleMapsAPI(gooogleOptions).then((googleMaps) => {

            //init the map
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 8,
                center: {lat: 8.48059, lng: -11.8085401},
                mapTypeId: 'terrain'
            });

            map.props = this.props;

            // Add listner for clicks on the map
            google.maps.event.addListener(map,'click', function(event) {
                console.log(map);
                console.log(event);
                this.props.updateCurrentOrg({'longitude':event.latLng.lng(), 'lattitude':event.latLng.lat(), "map":map, "props":this.props});
                this.props.showAddOrgModal(true);


            });
           

            // Get all organisational units
            this.props.fetchOrganisations(map).
            then((orgs) => {
                this.setState({
                    isLoading: false
                });
            });

        }).catch((err) => {
            console.error(err);
        });
    }

    showchangeModalYo(props, organisation){
        props.updateCurrentOrg(organisation);
        props.showChangeOrgModal(true);
    }


    /*
    A functions which displays properties of a
    organisational unit on the map when selected 
    by the user in the results list. 

    The function draws the borders of a district
    or a chiefdom and displays a facility as a 
    marker.
    */
    onItemClick(item, parent, map, singles) {
        // get the list element
        var element = document.getElementById(item.id);

        // If open, close it
        if(element.style.display == 'inline-block'){            
            element.style.display = 'none';

            //remove the markers
            singleMarkers.forEach((mrkr) =>{
                if(item.level == 4 && mrkr.label == item.displayName){                   
                    mrkr.setMap(null);
                }
            });

            return;
        }

        // Open it
        else{
            element.style.display = 'inline-block';
        }    

        // Show a facility
        if(item.level == 4){

            // If the API don't have coordinates for the facility
            if(item.coordinatesObject == undefined){
                window.alert("DHIS2 does not have coordinates for this unit");
                return;
            }

            // Taking into account that some organisational
            // units have invalid parent data
            var district = " ";
            var chiefdom = " ";

            if(item.parent != undefined)
                chiefdom = item.parent.displayName;
            if(item.parent.parent != undefined)
                district = item.parent.parent.displayName

            // Text for info window
            var info =  '<div id="content">'+
                '<div id="siteNotice">'+
                '</div>'+
                '<h2 id="secondHeading" class="secondHeading">'+ item.displayName+'</h2>'+
                '<div id="bodyContent">'+
                '<p><b>Chiefdom: </b>'+ chiefdom +
                '<p><b>District: </b>'+ district +
                '</p>'+
                '</div>'+
                '</div>';

            // Creates the marker
            var marker = new google.maps.Marker({
                position: item.coordinatesObject[0],
                label: item.displayName,
                map: map
            });

            // Create an info window for the marker
            var infowindow = new google.maps.InfoWindow({
                content: info
            });

            // Add listener to marker so info window is displayed if marker is clicked
            marker.addListener('click', function() {
                infowindow.open(map, marker);
            });
            singleMarkers.push(marker);

        }

        // Show a Chiefdoms border overlay and give it an info window
        else if(item.level == 3){

            // Error Message if no coordinates
            if(item.coordinatesObject == undefined){
                window.alert("DHIS2 does not have coordinates for this unit");
                return;
            }

            // Remove existing polygons
            parent.showNoBorders(parent, map, singles);

            // Content for info window
            var info =  '<div id="content">'+
                '<div id="siteNotice">'+
                '</div>'+
                '<h2 id="secondHeading" class="secondHeading">'+ item.displayName+'</h2>'+
                '<div id="bodyContent">'+
                '<p><b>Facilities in this Chiefdom: </b></p>'+
                '<p>';

            item.children.forEach((child) => {
                info += child.displayName + '<br/>'
            });

            info += '</p>'+'</div>'+'</div>';

            // Create new polygon
            var chiefdomBorder = new google.maps.Polygon({
                paths: item.coordinatesObject,
                strokeColor: '#008822',
                strokeOpacity: 1,
                strokeWeight: 1,
                fillColor: '#008822',
                fillOpacity: 0.20,
                map: map
            });

            // Create the info window
            var infowindow = new google.maps.InfoWindow({
                content: info,
                position: item.centerCoordinates
            });

            // Add a listene to the polygon so when clicked it 
            // zooms in and displays the info window
            chiefdomBorder.addListener('click', function(event) {
                map.setZoom(10);
                map.setCenter(bounds.getCenter());
                infowindow.open(map);
            });

            // Add polygon to array to keep track
            singlePolygons.push(chiefdomBorder);
        }

        // Show a Districts border overlay
        else if(item.level == 2){

            // Error Message if no coordinates
            if(item.coordinatesObject == undefined){
                window.alert("DHIS2 does not have coordinates for this unit");
                return;
            }

            /*
            We don't want to remove existing single chiefdoms, user might want to see 
            in which district said chiefdom is located.*/
            var newSingles = []
            singles.forEach(function(single){
                if(single.type == "district")
                    newSingles.push(single)
            });

            // Remove polygons
            parent.showNoBorders(parent, map, newSingles);

            // Create new polygon
            var districtBorder = new google.maps.Polygon({
                paths: item.coordinatesObject,
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.25,
                type: "district",
                map: map
            });

            // Create a click listener to the polygon
            districtBorder.addListener('click', function(event) {
                // Hide the overlay
                districtBorder.setMap(null);

                // Zoom to district
                map.setZoom(9);
                map.setCenter(item.centerCoordinates);

                // Create polygons for all chiefdoms in the district
                item.children.forEach((child) => {
                    if(child.coordinates != undefined){

                        var j = JSON.parse(child.coordinates);

                        for(var i = 0; i < j.length; i+=1){
                            if(typeof j[i] != "number"){
                                j[i].forEach((c) => {
                                    if(c.length > 6){
                                        createChildPolygon(j[i],map, child);
                                    }
                                });
                            }   
                        }                      
                    }     
                });              

            });

            // Add polygon to array to keep track
            singlePolygons.push(districtBorder);
        }
    }

    render() {
        return (
            <div id="wrapper">
                <div id="search">
                    <div id="filter">
                        <Well>

                            <ControlLabel>Show border overlays:</ControlLabel><br/>
                            <ButtonGroup id="border-buttons">
                                <Button onClick={() => {this.props.showNoBorders(this.props, map, singlePolygons)}}>None</Button>
                                <Button onClick={() => {this.props.showDistrictBorders(this.props, map, singlePolygons)}}>Districts</Button>
                                <Button onClick={() => {this.props.showChiefdomBorders(this.props, map, singlePolygons)}}>Chiefdoms</Button>
                            </ButtonGroup><br/>

                            <ControlLabel>Search:</ControlLabel><br/>
                            <select id="select" onChange={(e) => this.props.changeLevel(e,this.props.search,this.props.organisations)} defaultValue="2">
                                <option value="" disabled>Filter levels--</option>
                                <option value="5">All Levels</option>
                                <option value="2">District</option>
                                <option value="3">Chiefdoms</option>
                                <option value="4">Facilities</option>
                            </select><br/>


                            <FormControl
                                type="text"
                                placeholder="Search Organisation Units..."
                                onChange={ (text) => { this.props.findMatchingElements( this.props.organisations, text) }}
                            />

                            <ControlLabel id="results-label">Results:</ControlLabel><br/>
                            {this.state.isLoading ? <div id="loading"><div id="inner-loading"><h1>Loading data from DHIS2 ...</h1></div></div> : <div></div>}
                            <div id="results-wrapper">
                                <List
                                    onItemClick={this.onItemClick}
                                    organisations={this.props.search}
                                    props={this.props}
                                    map={map}
                                    singles ={singlePolygons}
                                    showchangeModalYo={this.showchangeModalYo}
                                />
                            </div>

                        </Well>
                    </div>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    return{
        organisations: state.organisations,
        search: state.search,
        markers: state.markers,
        ui : state.ui,
        chiefdomBorders: state.chiefdomBorder,
        districtBorders: state.districtBorder,
        chiefdomBorderPolygons: state.chiefdomBorderPolygon,
        districtBorderPolygons: state.districtBorderPolygon
    }
};

const mapDispatchToProps = (dispatch) => {
    return {
        recievedOrganisations: payload => dispatch(recievedOrganisations(payload)),
        fetchOrganisations : (map) => dispatch(fetchOrganisations(map)),
        findMatchingElements : (data, search) => dispatch(findMatchingElements(data, search)),
        getLocation: name => dispatch(getLocation(name)),
        changeLevel: (level, search, organisations) => dispatch(changeLevel(level, search, organisations)),
        showAddOrgModal: b => dispatch(showAddOrgModal(b)),
        showDistrictBorders: (props, map, singlePolys) => dispatch(showDistrictBorder(props, map, singlePolys)),
        showChiefdomBorders: (props, map, singlePolys) => dispatch(showChiefdomBorder(props, map, singlePolys)),
        showNoBorders: (props, map, singlePolys) => dispatch(showNoBorder(props, map, singlePolys)),
        createChildPolygon: (cords, map, child) => dispatch(createChildPolygon(cords,map, child)),
        updateSearch: (data) => dispatch(updateSearch(data)),
        addNewOganisationUnit: (name, shortName, date) => dispatch(addNewOganisationUnit(name, shortName, date)),
        editOganisationUnit: (name, shortName, date, id) => dispatch(editOganisationUnit(name, shortName, date, id)),
        updateCurrentOrg: (org) => dispatch(updateCurrentOrg(org)),
        showChangeOrgModal: (b) => dispatch(showChangeOrgModal(b))
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Search);
