export default (state = [], action) => {
  switch (action.type) {
    case 'ADD_CHIEFDOM_BORDER_POLYGON':  
        return [...state, action.chiefdomBorder] 
    case 'UPDATE_CHIEFDOM_BORDER_POLYGON':
    	return action.polys
    default:
          return state;
  }
};