# NodeVis
   
 
**Install dependencies**:
   
   Run the following command to install the necessary Node.js dependencies.
   ```bash
   npm install
   ```

**Start the HTTP Server**:
   
   Run the following command to start the server:
   
   ```bash
     node server.js
   ```

**View in Browser**:
   
   Open your web browser e.g. Chrome and navigate to: <http://localhost:3000>
   
You should now be able to see the interactive graph visualization. 


## Interactions

### Change Node Label 
Not applicable for both layouts. 
For force layout, switching layouts is unneccessary as all details are readily available and nodes are not arranged according to labels. 
It follows from the last time I asked about not adding an explicit label as I already was using hover to display details of node. 
So the first layout has no labels!
For hierarchial layout, switching layouts is not possible aas there are no "edge connections" between fields like genre and director names.

### Details on Demand 
Hover over nodes to see all details.

### Node Search Capabilities
Switch between different fields and access dropdown to search for values

### Modify Node attributes
Right click on a node to access Modify Node option

### Delete Nodes
Right click on a node to access Delete Node option

### Delete Edges 
Right click on a node to access Delete Edge option
   
    
