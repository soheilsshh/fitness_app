import { useEffect, useState } from "react";
import LiveWebinar from "@/components/LiveWebinar";
import RegisterModal from "@/components/RegisterModal";
import { apiService } from "@/services/api";
import { isWebinarPreviewMode, PREVIEW_REGISTRATION_DATA } from "@/config/webinarPreview";

const Index = () => {
  const previewMode = isWebinarPreviewMode();
  const [showRegisterModal, setShowRegisterModal] = useState(!previewMode);

  useEffect(() => {
    if (previewMode) {
      if (!localStorage.getItem("registrationData")) {
        localStorage.setItem("registrationData", JSON.stringify(PREVIEW_REGISTRATION_DATA));
      }
      setShowRegisterModal(false);
      return;
    }

    const registrationData = localStorage.getItem('registrationData');
    
    if (!registrationData) {
      // User is not registered - show modal instead of redirecting
      setShowRegisterModal(true);
      return;
    }

    // User is registered - track click
    try {
      const data = JSON.parse(registrationData);
      if (data.phone) {
        // Track webinar click
        apiService.trackClick(data.phone).catch(err => {
          console.error('Failed to track click:', err);
        });
        
        // Track registration link click (if coming from webinar)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('from') === 'webinar' || urlParams.get('source') === 'webinar') {
          apiService.trackLandingActivity(
            data.phone, 
            'clicked_registration_link', 
            data.firstName, 
            data.lastName
          ).catch(err => {
            console.error('Failed to track registration link click:', err);
          });
        }
      }
    } catch (error) {
      console.error('Failed to parse registration data:', error);
    }
  }, [previewMode]);

  // Note: Heartbeat is handled by LiveWebinar component
  // It works even before webinar starts to track users on landing page

  const handleRegistrationSuccess = () => {
    setShowRegisterModal(false); // Close modal after successful registration
    // Track click after successful registration
    const registrationData = localStorage.getItem('registrationData');
    if (registrationData) {
      try {
        const data = JSON.parse(registrationData);
        if (data.phone) {
          apiService.trackClick(data.phone).catch(err => {
            console.error('Failed to track click:', err);
          });
        }
      } catch (error) {
        console.error('Failed to parse registration data:', error);
      }
    }
  };

  return (
    <>
      {/* Always show LiveWebinar in background */}
      <LiveWebinar />
      
      {/* Show registration modal if user is not registered */}
      <RegisterModal 
        open={showRegisterModal} 
        onOpenChange={setShowRegisterModal}
        onSuccess={handleRegistrationSuccess}
      />
    </>
  );
};

export default Index;
