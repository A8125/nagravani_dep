
curl -X POST http://localhost:3000/api/report \                                         
  -H "Content-Type: application/json" \
  -d '{
    "title": "Broken streetlight on MG Road",
    "category": "streetlight",
    "ward": "Gandhi Nagar",
    "description": "The streetlight near MG Road junction has been broken for 3 weeks. Very dark at night, safety risk for pedestrians.",
    "citizen_name": "Ravi Kumar",
    "aadhaar": "123456789012",
    "severity": "high"
  }'
  curl -X POST http://localhost:3000/api/report \                                         
  -H "Content-Type: application/json" \
  -d '{
    "title": "Streetlight not working near MG Road",
    "category": "streetlight",
    "ward": "Gandhi Nagar",
    "description": "The streetlight at the MG Road junction is completely out. People are struggling to walk at night and there have been minor accidents.",
    "citizen_name": "Anjali Nair",
    "aadhaar": "456789012345",
    "severity": "medium"
  }'


**Related**
[[Complaint_System_Architecture]]

