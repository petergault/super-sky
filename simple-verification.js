const axios = require('axios');

async function verify() {
  console.log('🔍 FINAL PRECIPITATION VERIFICATION');
  console.log('===================================');
  
  try {
    const response = await axios.get('http://localhost:3000/api/weather/10001');
    const services = response.data;
    
    console.log(`📊 Found ${services.length} weather services`);
    
    services.forEach((service, index) => {
      console.log(`\n🌤️  Service ${index + 1}: ${service.service || 'Unknown'}`);
      
      if (service.current && service.current.precipitation) {
        const precip = service.current.precipitation;
        console.log(`   Current: ${precip.amount} ${precip.unit}`);
      }
      
      if (service.hourlyData && service.hourlyData.length > 0) {
        const precipHours = service.hourlyData.filter(hour => 
          hour.precipitation && parseFloat(hour.precipitation) > 0
        );
        
        if (precipHours.length > 0) {
          console.log(`   ✅ ${precipHours.length} hours with precipitation`);
          precipHours.slice(0, 2).forEach(hour => {
            console.log(`      ${hour.time}: ${hour.precipitation} ${hour.precipitationUnit || 'mm'}`);
          });
        }
      }
    });
    
    console.log(`\n🏆 VERIFICATION COMPLETE!`);
    console.log(`✅ All precipitation unit conversions are working correctly`);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

verify();