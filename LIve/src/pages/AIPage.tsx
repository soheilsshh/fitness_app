import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import { normalizePhoneNumber } from '@/utils/phoneUtils';
import { config } from '@/config/environment';
import LandingContactModal from '@/components/LandingContactModal';

const AIPage = () => {
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(4900000); // Default fallback
  const [showContactModal, setShowContactModal] = useState(false);
  const [hasContactInfo, setHasContactInfo] = useState(false);

  useEffect(() => {
    // Fetch payment config - with cache busting
    const fetchPrice = () => {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      fetch(`${config.API_BASE_URL}/payment/config?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      })
        .then(res => res.json())
        .then((data) => {
          const price = data.subscription_price || 4900000;
          const oldPrice = (window as any).SUBSCRIPTION_PRICE;
          console.log('💰 Fetched subscription price:', price);
          if (oldPrice && oldPrice !== price) {
            console.log(`🔄 Price changed from ${oldPrice} to ${price} in payment gateway!`);
          }
          setSubscriptionPrice(price);
        // Make subscription price available globally for script tag
          (window as any).SUBSCRIPTION_PRICE = price;
          console.log('✅ window.SUBSCRIPTION_PRICE updated to:', price);
      })
      .catch((error) => {
        console.error('Failed to load payment config:', error);
        // Use default fallback
          const fallbackPrice = 4900000;
          (window as any).SUBSCRIPTION_PRICE = fallbackPrice;
          setSubscriptionPrice(fallbackPrice);
        });
    };

    // Fetch immediately
    fetchPrice();

    // Listen for price change events from admin panel
    const handlePriceChange = (event: CustomEvent) => {
      const newPrice = event.detail?.price;
      if (newPrice && typeof newPrice === 'number' && newPrice > 0) {
        console.log('📢 Received subscriptionPriceChanged event, new price:', newPrice);
        // Wait a bit for database to be ready, then force immediate refresh
        setTimeout(() => {
          console.log('🔄 Force refreshing price from server after price change event...');
          fetchPrice();
        }, 500); // Small delay to ensure DB write is complete
      }
    };
    
    window.addEventListener('subscriptionPriceChanged', handlePriceChange as EventListener);

    // Also refresh every 30 seconds to get latest price
    const interval = setInterval(fetchPrice, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('subscriptionPriceChanged', handlePriceChange as EventListener);
    };
  }, []);

  useEffect(() => {
    // Track landing entry
    const registrationData = localStorage.getItem('registrationData');
    let userPhone = '';
    let firstName = '';
    let lastName = '';
    
    if (registrationData) {
      try {
        const data = JSON.parse(registrationData);
        userPhone = data.phone || '';
        firstName = data.firstName || '';
        lastName = data.lastName || '';
        if (userPhone) {
          setHasContactInfo(true);
        }
      } catch (e) {
        console.error('Failed to parse registration data:', e);
      }
    }

    // Show contact modal if no contact info
    if (!userPhone) {
      setShowContactModal(true);
      return; // Don't track landing activity until contact info is provided
    }
    
    // If we have phone, track entry
    if (userPhone) {
      setHasContactInfo(true);
      apiService.trackLandingActivity(userPhone, 'entered_landing', firstName, lastName);
      
      // Update status to "in_landing" after a short delay
      setTimeout(() => {
        apiService.trackLandingActivity(userPhone, 'in_landing', firstName, lastName);
      }, 1000);
      
      // Track page visibility for accurate duration
      let isPageVisible = !document.hidden;
      let visibilityTimeout: NodeJS.Timeout | null = null;
      let isNavigatingToPayment = false; // Flag to prevent tracking left_landing when navigating to payment
      let isModalOpen = false; // Flag to prevent tracking when modal is open
      
      // Expose flag globally so payment functions can set it
      (window as any).__setNavigatingToPayment = (value: boolean) => {
        isNavigatingToPayment = value;
        console.log('[Tracking] isNavigatingToPayment set to:', value);
      };
      
      // Track modal state and re-track in_landing when modal closes
      const paymentModal = document.getElementById('paymentModal');
      let previousModalState = false;
      if (paymentModal) {
        previousModalState = paymentModal.classList.contains('active');
        const modalObserver = new MutationObserver((mutations) => {
          const currentModalState = paymentModal.classList.contains('active');
          isModalOpen = currentModalState;
          console.log('[Tracking] Modal state changed, isModalOpen:', isModalOpen);
          
          // If modal was open and now closed, user is back in landing
          if (previousModalState && !currentModalState && isPageVisible) {
            console.log('[Tracking] Modal closed - user back in landing');
            apiService.trackLandingActivity(userPhone, 'in_landing', firstName, lastName, {
              reason: 'modal_closed',
              timestamp: new Date().toISOString()
            }).catch(err => {
              console.error('[Tracking] Failed to track in_landing after modal close:', err);
            });
          }
          
          previousModalState = currentModalState;
        });
        modalObserver.observe(paymentModal, { attributes: true, attributeFilter: ['class'] });
      }
      
      // Track payment options modal state
      const paymentOptionsModal = document.getElementById('paymentOptionsModal');
      let previousPaymentOptionsModalState = false;
      if (paymentOptionsModal) {
        previousPaymentOptionsModalState = paymentOptionsModal.classList.contains('active');
        const paymentOptionsModalObserver = new MutationObserver((mutations) => {
          const currentModalState = paymentOptionsModal.classList.contains('active');
          console.log('[Tracking] Payment options modal state changed:', currentModalState);
          
          // If modal was open and now closed, user is back in landing
          if (previousPaymentOptionsModalState && !currentModalState && isPageVisible) {
            console.log('[Tracking] Payment options modal closed - user back in landing');
            apiService.trackLandingActivity(userPhone, 'in_landing', firstName, lastName, {
              reason: 'payment_options_modal_closed',
              timestamp: new Date().toISOString()
            }).catch(err => {
              console.error('[Tracking] Failed to track in_landing after payment options modal close:', err);
            });
          }
          
          previousPaymentOptionsModalState = currentModalState;
        });
        paymentOptionsModalObserver.observe(paymentOptionsModal, { attributes: true, attributeFilter: ['class'] });
      }
      
      const handleVisibilityChange = () => {
        // Clear any pending timeout
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
          visibilityTimeout = null;
        }
        
        if (document.hidden) {
          // Don't track if user is navigating to payment gateway (redirect)
          if (isNavigatingToPayment) {
            console.log('[Tracking] Ignoring visibilitychange - navigating to payment gateway');
            return;
          }
          
          // Page is hidden - wait a bit to see if it's just a brief moment (like modal opening)
          visibilityTimeout = setTimeout(() => {
            // Check again after delay - if still hidden and not navigating/modal, user left
            if (document.hidden && !isNavigatingToPayment && !isModalOpen && isPageVisible) {
              isPageVisible = false;
              console.log('[Tracking] Page hidden for extended time - user left landing');
              
              // Track leaving - use sendBeacon for reliability
              const payload = JSON.stringify({
                phone: userPhone,
                status: 'left_landing',
                first_name: firstName,
                last_name: lastName,
                metadata: JSON.stringify({ 
                  reason: 'page_hidden_extended',
                  timestamp: new Date().toISOString()
                })
              });
              
              if (navigator.sendBeacon) {
                navigator.sendBeacon(
                  `${config.API_BASE_URL}/landing/track`,
                  new Blob([payload], { type: 'application/json' })
                );
              }
            }
          }, 2000); // Wait 2 seconds before tracking as "left"
        } else {
          // Page is visible again - cancel any pending "left" tracking
          if (visibilityTimeout) {
            clearTimeout(visibilityTimeout);
            visibilityTimeout = null;
          }
          
          // Reset navigation flag when page becomes visible again (user might have returned)
          if (isNavigatingToPayment) {
            console.log('[Tracking] Page visible again - resetting navigation flag');
            isNavigatingToPayment = false;
            if ((window as any).__setNavigatingToPayment) {
              (window as any).__setNavigatingToPayment(false);
            }
          }
          
          // If page was hidden (user left) and now visible again, mark as back in landing
          if (!isPageVisible && !isModalOpen) {
            isPageVisible = true;
            console.log('[Tracking] Page visible - user returned to landing');
            apiService.trackLandingActivity(userPhone, 'in_landing', firstName, lastName, {
              reason: 'page_visible',
              timestamp: new Date().toISOString()
            }).catch(err => {
              console.error('[Tracking] Failed to track in_landing:', err);
            });
          }
        }
      };
      
      // Track when window regains focus (user returned from another tab/window, e.g., from card-to-card payment)
      let lastFocusTime = 0;
      const handleFocus = () => {
        // Don't track if modal is open
        if (isModalOpen) {
          return;
        }
        
        // Throttle focus events to avoid duplicate tracking (max once per 2 seconds)
        const now = Date.now();
        if (now - lastFocusTime < 2000) {
          return;
        }
        lastFocusTime = now;
        
        // If page is visible and user is in landing, track in_landing
        // This handles cases where user returns from window.open (card-to-card payment)
        if (!document.hidden && isPageVisible) {
          console.log('[Tracking] Window focused - user in landing');
          apiService.trackLandingActivity(userPhone, 'in_landing', firstName, lastName, {
            reason: 'window_focused',
            timestamp: new Date().toISOString()
          }).catch(err => {
            console.error('[Tracking] Failed to track in_landing on focus:', err);
          });
        }
      };
      
      // Update duration every 30 seconds - but only if page is visible and user is still in landing
      // IMPORTANT: This should NOT change the status, only update duration
      const durationInterval = setInterval(() => {
        // Only update if page is visible and user is still in landing
        // Don't update if user has left (isPageVisible is false)
        if (!document.hidden && isPageVisible) {
          // Only update duration, don't change status
          apiService.updateLandingDuration(userPhone);
        }
      }, 30000);
      
      // Track page unload (closing tab/window) - ONLY when actually closing, not navigating
      const handleBeforeUnload = () => {
        // Don't track if user is navigating to payment
        if (isNavigatingToPayment) {
          console.log('[Tracking] Ignoring beforeunload - user is navigating to payment');
          return;
        }
        
        console.log('[Tracking] Page unloading - user left landing (closing tab/window)');
        // Use sendBeacon for reliable tracking on page unload
        const registrationData = localStorage.getItem('registrationData');
        if (registrationData) {
          try {
            const data = JSON.parse(registrationData);
            if (data.phone) {
              const payload = JSON.stringify({
                phone: data.phone,
                status: 'left_landing',
                first_name: data.firstName || '',
                last_name: data.lastName || '',
                metadata: JSON.stringify({ reason: 'page_unload' })
              });
              
              // Use sendBeacon for reliable delivery
              if (navigator.sendBeacon) {
                navigator.sendBeacon(
                  `${config.API_BASE_URL}/landing/track`,
                  new Blob([payload], { type: 'application/json' })
                );
              } else {
                // Fallback: synchronous fetch (may not complete)
                fetch(`${config.API_BASE_URL}/landing/track`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: payload,
                  keepalive: true
                }).catch(() => {
                  // Ignore errors on unload
                });
              }
            }
          } catch (e) {
            console.error('Failed to track page unload:', e);
          }
        }
      };
      
      const handlePageHide = (e: PageTransitionEvent) => {
        // Don't track if user is navigating to payment
        if (isNavigatingToPayment) {
          console.log('[Tracking] Ignoring pagehide - user is navigating to payment');
          return;
        }
        
        // Only track if page is being unloaded (not just hidden)
        if (e.persisted === false) {
          console.log('[Tracking] Page hide (not persisted) - user left landing');
          const registrationData = localStorage.getItem('registrationData');
          if (registrationData) {
            try {
              const data = JSON.parse(registrationData);
              if (data.phone) {
                const payload = JSON.stringify({
                  phone: data.phone,
                  status: 'left_landing',
                  first_name: data.firstName || '',
                  last_name: data.lastName || '',
                  metadata: JSON.stringify({ reason: 'page_hide' })
                });
                
                if (navigator.sendBeacon) {
                  navigator.sendBeacon(
                    `${config.API_BASE_URL}/landing/track`,
                    new Blob([payload], { type: 'application/json' })
                  );
                }
              }
            } catch (e) {
              console.error('Failed to track page hide:', e);
            }
          }
        }
      };
      
      // Add event listeners immediately
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handlePageHide);
      window.addEventListener('focus', handleFocus);
      
      // Test visibility on mount
      console.log('[Tracking] Initial page visibility:', !document.hidden, 'isPageVisible:', isPageVisible);
      
      // Cleanup on unmount
      return () => {
        clearInterval(durationInterval);
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        window.removeEventListener('focus', handleFocus);
        
        // Track leaving on component unmount
        if (isPageVisible) {
          console.log('[Tracking] Component unmounting - user left landing');
          // Use sendBeacon for reliable delivery on unmount
          const payload = JSON.stringify({
            phone: userPhone,
            status: 'left_landing',
            first_name: firstName,
            last_name: lastName,
            metadata: JSON.stringify({ reason: 'component_unmount' })
          });
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon(
              `${config.API_BASE_URL}/landing/track`,
              new Blob([payload], { type: 'application/json' })
            );
          } else {
            // Fallback
            fetch(`${config.API_BASE_URL}/landing/track`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true
            }).catch(() => {
              // Ignore errors on unmount
            });
          }
        }
      };
    }
  }, []);

  useEffect(() => {
    // Make API_BASE_URL available globally for script tag
    (window as any).API_BASE_URL = config.API_BASE_URL;
    // Countdown Timer - 8 hours (always resets to 8 hours)
    (function () {
      const EIGHT_HOURS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const STORAGE_KEY = 'countdown_end_time';
      
      const $d = document.getElementById('days'),
            $h = document.getElementById('hours'),
            $m = document.getElementById('minutes'),
            $s = document.getElementById('seconds');
      
      if (!$d || !$h || !$m || !$s) return;
      
      // Get or set end time
      let endTime: number;
      const storedTime = localStorage.getItem(STORAGE_KEY);
      if (!storedTime || Date.now() >= parseInt(storedTime)) {
        // Set new end time (8 hours from now)
        endTime = Date.now() + EIGHT_HOURS;
        localStorage.setItem(STORAGE_KEY, endTime.toString());
      } else {
        endTime = parseInt(storedTime);
      }
      
      function tick() {
        let diff = endTime - Date.now();
        
        // If time is up, reset to 8 hours
        if (diff <= 0) {
          endTime = Date.now() + EIGHT_HOURS;
          localStorage.setItem(STORAGE_KEY, endTime.toString());
          diff = EIGHT_HOURS;
        }
        
        const sec  = Math.floor(diff / 1000) % 60,
              min  = Math.floor(diff / 60000) % 60,
              hour = Math.floor(diff / 3600000) % 24,
              day  = Math.floor(diff / 86400000);
        
        if ($d) $d.textContent = day.toString();
        if ($h) $h.textContent = hour.toString().padStart(2,'0');
        if ($m) $m.textContent = min.toString().padStart(2,'0');
        if ($s) $s.textContent = sec.toString().padStart(2,'0');
        
        requestAnimationFrame(tick);
      }
      tick();
    })();
    
    // Features Click Reveal
    document.querySelectorAll('.badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const text = badge.getAttribute('data-detail');
        const popup = document.getElementById('feature-detail-popup');
        if (popup && text) {
          popup.textContent = text;
          popup.classList.add('visible');
        }
      });
    });
    
    // Carousel functionality
    let slideIndex = 1;
    
    function showSlide(n: number) {
      let slides = document.getElementsByClassName("carousel-slide") as HTMLCollectionOf<HTMLElement>;
      let dots = document.getElementsByClassName("dot") as HTMLCollectionOf<HTMLElement>;
      
      if (n > slides.length) { slideIndex = 1; }
      if (n < 1) { slideIndex = slides.length; }
      
      for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
      }
      
      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
      }
      
      if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].classList.add("active");
      }
      if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add("active");
      }
    }
    
    // Make functions global for onclick handlers
    (window as any).changeSlide = function(n: number) {
      showSlide(slideIndex += n);
    };
    
    (window as any).currentSlide = function(n: number) {
      showSlide(slideIndex = n);
    };
    
    showSlide(slideIndex);
    
    // Auto slide every 4 seconds
    const carouselInterval = setInterval(() => {
      slideIndex++;
      if (slideIndex > 6) slideIndex = 1;
      showSlide(slideIndex);
    }, 4000);
    
    // Payment Modal Functions
    let currentStep = 1;
    
    (window as any).openPaymentModal = function() {
      const modal = document.getElementById('paymentModal');
      if (modal) {
        modal.classList.add('active');
        // Lock body and html scroll when modal is open
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        (window as any).__modalScrollY = scrollY;
        
        // Track click on "Permanent Subscription" button
        const registrationData = localStorage.getItem('registrationData');
        if (registrationData) {
          try {
            const data = JSON.parse(registrationData);
            if (data.phone) {
              console.log('[Tracking] Clicked on "Permanent Subscription" button');
              apiService.trackLandingActivity(data.phone, 'clicked_payment_button', data.firstName, data.lastName, {
                action: 'clicked_payment_button',
                button: 'تهیه اشتراک دائمی'
              });
            }
          } catch (e) {
            console.error('Failed to parse registration data:', e);
          }
        }
        
        // Check if user has already registered in workshop
        if (registrationData) {
          try {
            const data = JSON.parse(registrationData);
            const userName = (data.firstName && data.lastName) ? `${data.firstName} ${data.lastName}` : '';
            const userPhone = data.phone || '';
            
            // Fill in the form fields
            const userNameInput = document.getElementById('userName') as HTMLInputElement;
            const userPhoneInput = document.getElementById('userPhone') as HTMLInputElement;
            if (userNameInput) userNameInput.value = userName;
            if (userPhoneInput) userPhoneInput.value = userPhone;
          } catch (e) {
            // If parsing fails, clear fields
            const userNameInput = document.getElementById('userName') as HTMLInputElement;
            const userPhoneInput = document.getElementById('userPhone') as HTMLInputElement;
            if (userNameInput) userNameInput.value = '';
            if (userPhoneInput) userPhoneInput.value = '';
          }
        } else {
          // No registration data, clear fields
          const userNameInput = document.getElementById('userName') as HTMLInputElement;
          const userPhoneInput = document.getElementById('userPhone') as HTMLInputElement;
          if (userNameInput) userNameInput.value = '';
          if (userPhoneInput) userPhoneInput.value = '';
        }
      }
    };
    
    (window as any).closePaymentModal = function() {
      const modal = document.getElementById('paymentModal');
      if (modal) {
        modal.classList.remove('active');
        // Unlock body and html scroll when modal is closed
        const scrollY = (window as any).__modalScrollY || 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, scrollY);
        delete (window as any).__modalScrollY;
        
        const userName = document.getElementById('userName') as HTMLInputElement;
        const userPhone = document.getElementById('userPhone') as HTMLInputElement;
        if (userName) userName.value = '';
        if (userPhone) userPhone.value = '';
      }
    };
    
    (window as any).submitAndProceedToPayment = async function() {
      const userNameInput = document.getElementById('userName') as HTMLInputElement;
      const userPhoneInput = document.getElementById('userPhone') as HTMLInputElement;
      const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
      
      if (!userNameInput || !userPhoneInput) {
        alert('لطفاً تمام فیلدها را پر کنید');
        return;
      }
      
      const userName = userNameInput.value.trim();
      const userPhone = userPhoneInput.value.trim();
      
      if (!userName || !userPhone) {
        alert('لطفاً نام و شماره تماس خود را وارد کنید');
        return;
      }
      
      // Validate phone number (Iranian format)
      const phoneRegex = /^09\d{9}$/;
      const normalizedPhone = normalizePhoneNumber(userPhone);
      if (!phoneRegex.test(normalizedPhone)) {
        alert('لطفاً شماره تماس معتبر وارد کنید (مثال: 09123456789)');
        return;
      }
      
      // Show loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال اتصال به درگاه...';
      }
      
      try {
        // Split name into first and last name
        const nameParts = userName.split(' ').filter(part => part.trim());
        const firstName = nameParts[0] || userName;
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Create payment request
        const response = await apiService.createPaymentRequest({
          first_name: firstName,
          last_name: lastName,
          phone: normalizedPhone,
          amount: (window as any).SUBSCRIPTION_PRICE || subscriptionPrice,
          type: 'subscription',
          description: 'اشتراک مادام‌العمر MonetizeAI'
        });
        
        if (response.success && response.payment_url) {
          // Set flag to prevent tracking left_landing when navigating to payment
          if ((window as any).__setNavigatingToPayment) {
            (window as any).__setNavigatingToPayment(true);
          }
          // Redirect to ZarinPal payment page
          window.location.href = response.payment_url;
        } else {
          throw new Error(response.error || response.message || 'خطا در ایجاد درخواست پرداخت');
        }
      } catch (error: any) {
        console.error('Payment request failed:', error);
        alert('خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ثبت و تهیه اشتراک ویژه';
        }
      }
    };
    
    (window as any).proceedToPayment = async function() {
      const userNameInput = document.getElementById('userName') as HTMLInputElement;
      const userPhoneInput = document.getElementById('userPhone') as HTMLInputElement;
      const paymentMethodRadio = document.querySelector('input[name="payment"]:checked') as HTMLInputElement;
      
      if (!userNameInput || !userPhoneInput || !paymentMethodRadio) {
        alert('لطفاً تمام فیلدها را پر کنید');
        return;
      }
      
      const userName = userNameInput.value.trim();
      const userPhone = userPhoneInput.value.trim();
      const paymentMethod = paymentMethodRadio.value;
      
      if (!userName || !userPhone) {
        alert('لطفاً نام و شماره تماس خود را وارد کنید');
        return;
      }
      
      // Validate phone number (Iranian format)
      const phoneRegex = /^09\d{9}$/;
      const normalizedPhone = normalizePhoneNumber(userPhone);
      if (!phoneRegex.test(normalizedPhone)) {
        alert('لطفاً شماره تماس معتبر وارد کنید (مثال: 09123456789)');
        return;
      }
      
      if (paymentMethod === 'card-to-card') {
        // Track card-to-card click
        const registrationData = localStorage.getItem('registrationData');
        if (registrationData) {
          try {
            const data = JSON.parse(registrationData);
            if (data.phone) {
              apiService.trackLandingActivity(data.phone, 'clicked_card_to_card', data.firstName, data.lastName);
            }
          } catch (e) {
            console.error('Failed to parse registration data:', e);
          }
        }
        
        window.open('https://t.me/sian_academy_support', '_blank');
        alert('لطفاً رسید پرداخت را به پشتیبانی ارسال کنید.\n\nمبلغ: ۴,۹۰۰,۰۰۰ تومان\nشماره کارت: 5022-2913-2547-5315\nبه نام: حسین عباسیان');
        (window as any).closePaymentModal();
        return;
      }
      
      // Split name into first and last name
      const nameParts = userName.split(' ').filter(part => part.trim());
      const firstName = nameParts[0] || userName;
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Show loading
      const payBtn = document.getElementById('payBtn') as HTMLButtonElement;
      if (payBtn) {
        payBtn.disabled = true;
        payBtn.textContent = 'در حال اتصال به درگاه...';
      }
      
      // Track "entering gateway" status
      const registrationData = localStorage.getItem('registrationData');
      if (registrationData) {
        try {
          const data = JSON.parse(registrationData);
          if (data.phone) {
            // Track entering gateway
            apiService.trackLandingActivity(data.phone, 'payment_initiated', firstName, lastName, {
              action: 'entering_gateway'
            });
          }
        } catch (e) {
          console.error('Failed to parse registration data:', e);
        }
      }
      
      try {
        // Create payment request
        const response = await apiService.createPaymentRequest({
          first_name: firstName,
          last_name: lastName,
          phone: normalizedPhone,
          amount: (window as any).SUBSCRIPTION_PRICE || subscriptionPrice,
          type: 'subscription',
          description: 'اشتراک مادام‌العمر MonetizeAI'
        });
        
        if (response.success && response.payment_url) {
          // Set flag to prevent tracking left_landing when navigating to payment
          if ((window as any).__setNavigatingToPayment) {
            (window as any).__setNavigatingToPayment(true);
          }
          // Redirect to ZarinPal payment page
          window.location.href = response.payment_url;
        } else {
          throw new Error(response.error || response.message || 'خطا در ایجاد درخواست پرداخت');
        }
      } catch (error: any) {
        console.error('Payment request failed:', error);
        alert('خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.');
        if (payBtn) {
          payBtn.disabled = false;
          payBtn.textContent = '💳 پرداخت آنلاین';
        }
      }
    };
    
    // Payment Options Modal Functions
    (window as any).openPaymentOptionsModal = function() {
      const modal = document.getElementById('paymentOptionsModal');
      if (modal) {
        modal.classList.add('active');
        // Lock body and html scroll when modal is open
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        (window as any).__modalScrollY = scrollY;
        
        (window as any).calculateNextInstallmentDate();
        
        // Track initial state when modal opens
        const selectedOption = (document.querySelector('input[name="paymentOption"]:checked') as HTMLInputElement)?.value;
        const registrationData = localStorage.getItem('registrationData');
        if (registrationData) {
          try {
            const data = JSON.parse(registrationData);
            if (data.phone) {
              // Track based on initial selection
              console.log(`[Tracking] Modal opened with option: ${selectedOption}`);
              if (selectedOption === 'card-to-card') {
                apiService.trackLandingActivity(data.phone, 'clicked_card_to_card', data.firstName, data.lastName, {
                  source: 'modal_opened'
                });
              } else if (selectedOption === 'installment') {
                apiService.trackLandingActivity(data.phone, 'clicked_installment', data.firstName, data.lastName, {
                  source: 'modal_opened'
                });
              }
            }
          } catch (e) {
            console.error('Failed to parse registration data:', e);
          }
        }
        
        // Update display after tracking
        (window as any).updatePaymentOptionDisplay();
        
        // Add event listeners to radio buttons for real-time tracking
        // Use a flag to prevent duplicate listeners
        if (!(modal as any).__trackingListenersAdded) {
          const paymentOptionRadios = document.querySelectorAll('input[name="paymentOption"]');
          paymentOptionRadios.forEach((radio: HTMLInputElement) => {
            radio.addEventListener('change', function() {
              if (this.checked) {
                const registrationData = localStorage.getItem('registrationData');
                if (registrationData) {
                  try {
                    const data = JSON.parse(registrationData);
                    if (data.phone) {
                      console.log(`[Tracking] Payment option changed to: ${this.value}`);
                      if (this.value === 'card-to-card') {
                        apiService.trackLandingActivity(data.phone, 'clicked_card_to_card', data.firstName, data.lastName, {
                          source: 'modal_option_change'
                        });
                      } else if (this.value === 'installment') {
                        apiService.trackLandingActivity(data.phone, 'clicked_installment', data.firstName, data.lastName, {
                          source: 'modal_option_change'
                        });
                      }
                    }
                  } catch (e) {
                    console.error('Failed to parse registration data:', e);
                  }
                }
                // Update display
                (window as any).updatePaymentOptionDisplay();
              }
            });
          });
          (modal as any).__trackingListenersAdded = true;
        }
      }
    };
    
    (window as any).closePaymentOptionsModal = function() {
      const modal = document.getElementById('paymentOptionsModal');
      if (modal) {
        modal.classList.remove('active');
        // Unlock body and html scroll when modal is closed
        const scrollY = (window as any).__modalScrollY || 0;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo(0, scrollY);
        delete (window as any).__modalScrollY;
      }
    };
    
    (window as any).updatePaymentOptionDisplay = function() {
      const selectedOption = (document.querySelector('input[name="paymentOption"]:checked') as HTMLInputElement)?.value;
      const cardToCardInfo = document.getElementById('cardToCardInfoOption');
      const installmentInfo = document.getElementById('installmentInfo');
      
      if (selectedOption === 'card-to-card') {
        if (cardToCardInfo) cardToCardInfo.style.display = 'block';
        if (installmentInfo) installmentInfo.style.display = 'none';
      } else if (selectedOption === 'installment') {
        if (cardToCardInfo) cardToCardInfo.style.display = 'none';
        if (installmentInfo) installmentInfo.style.display = 'block';
        (window as any).calculateNextInstallmentDate();
      }
    };
    
    (window as any).calculateNextInstallmentDate = function() {
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      
      const gregorianToPersian = (gYear: number, gMonth: number, gDay: number) => {
        const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        
        if (isLeap(gYear)) gDaysInMonth[1] = 29;
        
        let pYear = gYear - 621;
        let pMonth = 3;
        let pDay = 22;
        
        let days = 0;
        for (let i = 0; i < gYear - 621; i++) {
          days += isLeap(621 + i) ? 366 : 365;
        }
        
        for (let i = 0; i < gMonth; i++) {
          days += gDaysInMonth[i];
        }
        days += gDay - 1;
        
        const persianEpoch = 226899;
        const totalDays = days - persianEpoch;
        
        pYear = Math.floor(totalDays / 365.2422) + 1;
        let remainingDays = totalDays - Math.floor((pYear - 1) * 365.2422);
        
        const persianDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
        const isPersianLeap = (year: number) => {
          const a = (year + 2346) % 128;
          return a < 30 || (a < 62 && a % 4 === 1) || (a >= 62 && (a - 62) % 4 === 0);
        };
        
        if (isPersianLeap(pYear)) persianDaysInMonth[11] = 30;
        
        pMonth = 1;
        while (remainingDays >= persianDaysInMonth[pMonth - 1]) {
          remainingDays -= persianDaysInMonth[pMonth - 1];
          pMonth++;
        }
        pDay = remainingDays + 1;
        
        return { year: pYear, month: pMonth, day: pDay };
      };
      
      const persianDate = gregorianToPersian(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        nextMonth.getDate()
      );
      
      const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
      ];
      
      const toPersian = (n: number) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
      
      const day = toPersian(persianDate.day);
      const month = persianMonths[persianDate.month - 1];
      
      const dateElement = document.getElementById('installmentDateValue');
      if (dateElement) {
        dateElement.textContent = `${day} ${month}`;
      }
    };
    
    (window as any).proceedToPaymentOption = function() {
      window.open('https://t.me/sian_academy_support', '_blank');
      (window as any).closePaymentOptionsModal();
    };
    
    // Copy card number function
    (window as any).copyCardNumber = function(button: HTMLElement, cardNumber: string, cardType?: string) {
      const cardNumberClean = cardNumber.replace(/[^\d]/g, '');
      
      // Determine card type from context if not provided
      let actualCardType = cardType;
      if (!actualCardType) {
        // First, check which payment option is currently selected in the modal
        const selectedOption = (document.querySelector('input[name="paymentOption"]:checked') as HTMLInputElement)?.value;
        
        if (selectedOption === 'installment') {
          actualCardType = 'installment';
        } else if (selectedOption === 'card-to-card') {
          actualCardType = 'card-to-card';
        } else {
          // Fallback: Check if button is inside installmentInfo or cardToCardInfo
          const installmentInfo = document.getElementById('installmentInfo');
          const cardToCardInfo = document.getElementById('cardToCardInfoOption');
          
          if (installmentInfo && installmentInfo.contains(button)) {
            actualCardType = 'installment';
          } else if (cardToCardInfo && cardToCardInfo.contains(button)) {
            actualCardType = 'card-to-card';
          } else {
            // Check visibility of sections
            if (installmentInfo && installmentInfo.style.display !== 'none') {
              actualCardType = 'installment';
            } else if (cardToCardInfo && cardToCardInfo.style.display !== 'none') {
              actualCardType = 'card-to-card';
            } else {
              // Default to card-to-card if can't determine
              actualCardType = 'card-to-card';
            }
          }
        }
      }
      
      // Track card copy with accurate type
      const registrationData = localStorage.getItem('registrationData');
      if (registrationData) {
        try {
          const data = JSON.parse(registrationData);
          if (data.phone) {
            const status = actualCardType === 'installment' ? 'copied_installment_card' : 'copied_card_to_card';
            apiService.trackLandingActivity(data.phone, status, data.firstName, data.lastName, { 
              cardNumber: cardNumberClean,
              cardType: actualCardType,
              selectedOption: (document.querySelector('input[name="paymentOption"]:checked') as HTMLInputElement)?.value
            });
            console.log(`[Tracking] Card copied: ${actualCardType}, Status: ${status}`);
          }
        } catch (e) {
          console.error('Failed to parse registration data:', e);
        }
      }
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cardNumberClean).then(() => {
          const originalText = button.innerHTML;
          button.innerHTML = '✓ کپی شد!';
          button.classList.add('copied');
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          fallbackCopy(cardNumberClean, button);
        });
      } else {
        fallbackCopy(cardNumberClean, button);
      }
    };
    
    function fallbackCopy(text: string, button: HTMLElement) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        const originalText = button.innerHTML;
        button.innerHTML = '✓ کپی شد!';
        button.classList.add('copied');
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        alert('شماره کارت: ' + text);
      }
      
      document.body.removeChild(textarea);
    }
    
    // Close modal when clicking outside
    const paymentModal = document.getElementById('paymentModal');
    if (paymentModal) {
      paymentModal.addEventListener('click', function(e) {
        if (e.target === this) {
          (window as any).closePaymentModal();
        }
      });
    }
    
    const paymentOptionsModal = document.getElementById('paymentOptionsModal');
    if (paymentOptionsModal) {
      paymentOptionsModal.addEventListener('click', function(e) {
        if (e.target === this) {
          (window as any).closePaymentOptionsModal();
        }
      });
    }
    
    // Listen for payment method changes
    const paymentRadios = document.querySelectorAll('input[name="payment"]');
    paymentRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (currentStep === 2) {
          (window as any).updatePaymentMethod();
        }
      });
    });
    
    const paymentOptionRadios = document.querySelectorAll('input[name="paymentOption"]');
    paymentOptionRadios.forEach(radio => {
      radio.addEventListener('change', (window as any).updatePaymentOptionDisplay);
    });
    
    return () => {
      clearInterval(carouselInterval);
    };
  }, []);
  
  const landingHTML = `<!DOCTYPE html>

<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>MonetizeAI | سیستم درآمد دلاری با هوش مصنوعی</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;800;900&display=swap');
    
    body {
      margin: 0;
      padding-top: 2.5rem;
      padding-bottom: 80px;
      min-height: 100vh;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      background: linear-gradient(135deg, #0b1212 0%, #0a1616 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow-x: hidden;
      box-sizing: border-box;
    }
    
    .container {
      max-width: 500px;
      width: 90vw;
      margin: 2rem auto;
      background: rgba(13, 24, 24, 0.85);
      border-radius: 2.2rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      border: 2px solid rgba(255,255,255,0.11);
      padding: 2.5rem 1.3rem;
      text-align: center;
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      position: relative;
      animation: fadein 1.2s cubic-bezier(.34,.61,.71,.54);
      box-sizing: border-box;
    }
    
    @keyframes fadein {
      from {opacity: 0; transform: translateY(50px);}
      to {opacity: 1; transform: none;}
    }
    
    .logo-ai {
      width: 90px;
      height: 90px;
      margin: -2.2rem auto 1.5rem auto;
      background: none;
      border-radius: 1.5rem;
      box-shadow: 0 2px 18px #18727244, 0 0 0 6px #fff2;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pop 1.1s cubic-bezier(.3,.88,.53,.92);
    }
    
    @keyframes pop {
      0% {transform: scale(0.5);}
      60% {transform: scale(1.1);}
      100% {transform: scale(1);}
    }
    
    .logo-ai img {
      width: 80px;
      height: 80px;
      display: block;
      object-fit: contain;
      filter: drop-shadow(0 0 18px #18727299) drop-shadow(0 0 8px #2a9c9688);
      border-radius: 1.2rem;
      background: none;
      transition: transform 0.2s;
    }
    
    @media (max-width:600px) {
      .logo-ai { width: 60px; height: 60px; }
      .logo-ai img { width: 52px; height: 52px; }
    }
    
    h1 {
      margin-bottom: .9rem;
      margin-top: 0;
      line-height: 1.3;
      animation: fadein 1.3s .4s both;
    }
    
    h1 .brand-name {
      display: block;
      font-size: 5.5rem;
      background: linear-gradient(90deg,#58cac0,#26fce3,#187272 90%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 900;
      letter-spacing: 0.01em;
      text-shadow: 0 3px 12px #18727233;
      margin-bottom: 0.5rem;
    }
    
    h1 .subtitle {
      display: block;
      font-size: 2.3rem;
      color: #BFEAE5;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1.4;
    }
    
    .desc {
      color: #BFEAE5;
      font-size: 1.05rem;
      margin-bottom: 2.1rem;
      line-height: 1.6;
      font-weight: 400;
      animation: fadein 1.1s .5s both;
      white-space: nowrap;
    }
    
    @media (max-width: 600px) {
      .desc {
        white-space: normal;
        font-size: 0.95rem;
      }
    }
    
    .cta-btn {
      display: inline-block;
      padding: 1.1rem 2.8rem;
      border-radius: 2rem;
      background: linear-gradient(90deg, #26fce3 0%, #187272 60%, #26fce3 100%);
      color: #fff;
      font-weight: 900;
      font-size: 1.17rem;
      border: none;
      text-decoration: none;
      box-shadow: 0 0 18px #26fce399, 0 0 8px #18727255;
      margin-top: 1.1rem;
      cursor: pointer;
      letter-spacing: 0.04em;
      position: relative;
      overflow: hidden;
      transition: background 0.25s, box-shadow 0.25s, transform 0.18s;
      animation: cyberpunkPulse 2.2s infinite cubic-bezier(.45,.35,.5,1.15) alternate;
    }
    
    .cta-btn:hover {
      background: linear-gradient(90deg, #26fce3 0%, #187272 60%, #26fce3 100%);
      box-shadow: 0 0 32px #26fce3cc, 0 0 18px #2a9c9699, 0 0 8px #18727299;
      border: 2px solid #58cac0;
      transform: scale(1.04) rotate(-1deg);
      filter: brightness(1.15) saturate(1.2);
    }
    
    @keyframes cyberpunkPulse {
      0% { box-shadow: 0 0 18px #26fce399, 0 0 8px #18727255; }
      50% { box-shadow: 0 0 32px #26fce399, 0 0 18px #58cac099, 0 0 8px #26fce3cc; }
      100% { box-shadow: 0 0 18px #26fce399, 0 0 8px #18727255; }
    }
    
    .features-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      padding: 0;
      margin: 1.5rem 0;
      box-sizing: border-box;
    }
    
    .features-list {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      width: 100%;
      max-width: 100%;
      padding: 0;
      margin: 0;
      direction: rtl;
      box-sizing: border-box;
    }
    
    .feature-item {
      background: linear-gradient(135deg, rgba(24, 114, 114, 0.12), rgba(38, 252, 227, 0.08));
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 1.25rem;
      padding: 1.25rem 1.25rem;
      box-shadow: 0 8px 32px rgba(24, 114, 114, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 0.95rem;
      line-height: 1.6;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    
    .feature-item::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    
    .feature-item:hover::before {
      left: 100%;
    }
    
    .feature-item:hover {
      box-shadow: 0 12px 40px rgba(38, 252, 227, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      background: linear-gradient(135deg, rgba(24, 114, 114, 0.18), rgba(38, 252, 227, 0.12));
      border-color: rgba(88, 202, 192, 0.4);
      transform: translateY(-3px);
    }
    
    .feature-item.active {
      background: linear-gradient(135deg, rgba(24, 114, 114, 0.2), rgba(38, 252, 227, 0.15));
      border-color: rgba(88, 202, 192, 0.5);
      box-shadow: 0 12px 40px rgba(38, 252, 227, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    
    .feature-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 800;
      font-size: 1.05rem;
      background: linear-gradient(90deg, #26fce3, #58cac0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      gap: 0.5rem;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    
    .feature-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      text-align: right;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .arrow {
      font-size: 1.2rem;
      transform: rotate(0deg);
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(135deg, #58cac0, #26fce3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      flex-shrink: 0;
      font-weight: 900;
    }
    
    .feature-item.active .arrow {
      transform: rotate(90deg);
    }
    
    .feature-description {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.15);
      display: none;
      color: #BFEAE5;
      font-size: 0.95rem;
      line-height: 1.8;
      text-align: right;
      position: relative;
      z-index: 1;
    }
    
    .feature-item.active .feature-description {
      display: block;
      animation: fadeInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @media (max-width: 600px) {
      .feature-item {
        font-size: 0.95rem;
        padding: 1rem 0.8rem;
      }
      .feature-header {
        font-size: 1rem;
      }
      .feature-description {
        font-size: 0.9rem;
      }
    }
    
    @media (max-width: 480px) {
      .feature-item {
        font-size: 0.9rem;
        padding: 0.9rem 0.7rem;
      }
      .feature-header {
        font-size: 0.95rem;
      }
      .feature-description {
        font-size: 0.85rem;
      }
    }
    
    .pricebox {
      margin: 1.5rem auto 1rem auto;
      background: rgba(8,18,18,0.97);
      border-radius: 1.6rem;
      padding: 1.9rem 1.3rem 1.3rem 1.3rem;
      border: 1.5px solid #18727255;
      box-shadow: 0 4px 22px 0 #18727219;
      color: #fff;
      font-size: 1.21rem;
      font-weight: 700;
      letter-spacing: .02em;
      text-align: center;
      animation: fadein 1.3s .7s both;
    }
    
    .price-value {
      font-size: 2.1rem;
      background: linear-gradient(90deg,#17e07b,#00c853 85%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 900;
      letter-spacing: -0.02em;
      margin-bottom: 1rem;
      margin-top: 0;
      display: block;
      text-shadow: 0 2px 8px rgba(23, 224, 123, 0.3);
    }
    
    .price-old {
      display: block;
      color: #ff3750;
      text-decoration: line-through;
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
      margin-top: -0.7rem;
      letter-spacing: 0.01em;
    }
    
    .price-desc {
      color: #BFEAE5;
      font-size: 1rem;
      font-weight: 400;
      margin: 0 0 1.1rem 0;
    }
    
    .guarantee {
      color: #88FFCC;
      font-size: .98rem;
      background: #002A18dd;
      border-radius: 1.1rem;
      margin: 1rem auto 0 auto;
      padding: .6rem 1.1rem;
      width: fit-content;
      box-shadow: 0 0 18px #18ffb933;
      letter-spacing: .01em;
    }
    
    .discount-badge {
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      background: #ff3750;
      border-radius: 1rem;
      margin: 1rem auto 0 auto;
      padding: 0.7rem 1.3rem;
      width: fit-content;
      box-shadow: 0 4px 15px rgba(255, 55, 80, 0.4);
      letter-spacing: 0.01em;
      text-align: center;
      display: block;
    }
    
    /* Payment Options Banner */
    .payment-options-banner {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      text-align: center;
      box-sizing: border-box;
    }
    
    .payment-options-link {
      display: inline-block;
      padding: 1.2rem 2.5rem;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      color: #2abf1b;
      font-weight: 700;
      font-size: 1.2rem;
      text-decoration: none;
      border-radius: 2rem;
      box-shadow: 0 2px 15px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      letter-spacing: 0.01em;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    
    .payment-options-link:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #32d924;
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
    }
    
    .payment-options-link:active {
      transform: translateY(0);
    }
    
    /* Compare Section */
    .compare-section {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      padding: 2rem 1.3rem;
      background: rgba(13, 24, 24, 0.85);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      font-family: 'Vazirmatn', sans-serif;
      color: white;
      text-align: center;
      box-sizing: border-box;
    }
    
    .compare-section h2 {
      color: #58cac0;
      font-size: 1.4rem;
      margin-bottom: 1.5rem;
    }
    
    .compare-table {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    
    .compare-table .row {
      display: flex;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1rem;
      padding: 1rem 1rem;
      font-size: 1rem;
      gap: 0.5rem;
      border: 1px solid rgba(255,255,255,0.05);
    }
    
    .compare-table .row.header {
      background: linear-gradient(135deg, #26fce3, #187272);
      font-weight: 800;
      color: #fff;
      font-size: 1.1rem;
      border: none;
    }
    
    .compare-table .cell {
      width: 48%;
      text-align: center;
      line-height: 1.5;
    }
    
    .compare-section .note {
      margin-top: 2rem;
      color: #58cac0;
      font-size: 1.05rem;
      font-weight: 600;
      line-height: 1.6;
    }
    
    /* Countdown Box */
    .countdownbox {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      text-align: center;
      background: rgba(13, 24, 24, 0.85);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
    }
    
    .countdown-title {
      font-size: 1.3rem;
      color: #58cac0;
      font-weight: 800;
      margin-bottom: 1.2rem;
      letter-spacing: .01em;
    }
    
    #countdown {
      font-size: 1.2rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      gap: 1.2rem;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(6, 16, 16, 0.9));
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 1.5rem;
      padding: 2rem 2.5rem;
      box-shadow: 
        0 0 30px rgba(88, 202, 192, 0.3),
        0 0 60px rgba(24, 114, 114, 0.2),
        inset 0 2px 10px rgba(255, 255, 255, 0.1),
        inset 0 -2px 10px rgba(0, 0, 0, 0.5);
      direction: ltr;
      border: 2px solid rgba(88, 202, 192, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    #countdown::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(88, 202, 192, 0.03) 2px,
          rgba(88, 202, 192, 0.03) 4px
        );
      pointer-events: none;
      z-index: 0;
    }
    
    #countdown span { 
      min-width: 90px; 
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      position: relative;
      z-index: 1;
      font-size: 0.75rem;
      color: rgba(88, 202, 192, 0.7);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    
    #countdown span:not(:last-child)::after {
      content: ':';
      position: absolute;
      right: -0.6rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 3rem;
      color: rgba(88, 202, 192, 0.4);
      font-weight: 300;
      z-index: 2;
      text-shadow: 0 0 10px rgba(88, 202, 192, 0.5);
      animation: blink 1s infinite;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0.3; }
    }
    
    #countdown b {
      font-size: 4rem;
      margin: 0;
      color: #00FF88;
      font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
      display: block;
      font-weight: 700;
      letter-spacing: 0.05em;
      line-height: 1;
      text-shadow: 
        0 0 3px rgba(0, 255, 136, 0.3),
        0 2px 4px rgba(0, 0, 0, 0.8);
      background: linear-gradient(180deg, #00FF88, #00CC6A);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      filter: drop-shadow(0 0 2px rgba(0, 255, 136, 0.2));
    }
    
    /* Features Section */
    .features-click-reveal {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      padding: 2rem 1.3rem;
      background: rgba(13, 24, 24, 0.85);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      color: white;
      font-family: 'Vazirmatn', sans-serif;
      text-align: center;
      box-sizing: border-box;
    }
    
    .features-click-reveal h2 {
      font-size: 1.5rem;
      color: #58cac0;
      margin-bottom: 0.8rem;
      font-weight: 800;
    }
    
    .hint {
      color: #ccc;
      font-size: 1rem;
      margin-bottom: 1.8rem;
    }
    
    .badge-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      justify-content: center;
    }
    
    .badge {
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      padding: 0.7rem 1.1rem;
      border-radius: 0.875rem;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 2px 12px rgba(24, 114, 114, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
      position: relative;
      color: #fff;
      overflow: hidden;
    }
    
    .badge::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }
    
    .badge:hover::before {
      left: 100%;
    }
    
    .badge:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(88, 202, 192, 0.3);
      box-shadow: 0 4px 20px rgba(38, 252, 227, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12);
      transform: translateY(-1px);
    }
    
    .badge:active {
      transform: translateY(0);
    }
    
    .popup {
      margin-top: 1.5rem;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      font-size: 0.95rem;
      color: #BFEAE5;
      line-height: 1.7;
      box-shadow: 0 8px 32px rgba(24, 114, 114, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      max-width: 100%;
      margin-left: 0;
      margin-right: 0;
      display: none;
      text-align: right;
      box-sizing: border-box;
    }
    
    .popup.visible {
      display: block;
      animation: fadeInDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* FAQ Box */
    .faqbox { 
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto;
      background: rgba(13, 24, 24, 0.85);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      box-sizing: border-box;
    }
    
    .faq-title { 
      font-size: 1.5rem;
      color: #58cac0; 
      font-weight: 800;
      margin-bottom: 1.5rem;
      letter-spacing: .01em;
      text-align: center;
    }
    
    .faq-item { 
      margin-bottom: 1rem;
    }
    
    .faq-item label { 
      display: block; 
      font-size: 1.05rem; 
      color: #fff; 
      cursor: pointer; 
      font-weight: 700; 
      padding: 1rem 1.2rem; 
      background: rgba(255, 255, 255, 0.05); 
      border-radius: 1rem;
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
    }
    
    .faq-item label:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(88, 202, 192, 0.3);
    }
    
    .faq-item input {
      display: none;
    }
    
    .faq-body { 
      max-height: 0; 
      overflow: hidden; 
      transition: max-height 0.4s cubic-bezier(.56,.24,.64,1.4); 
      background: rgba(24, 114, 114, 0.15); 
      border-radius: 1rem; 
      color: #BFEAE5; 
      font-size: 1rem; 
      margin: 0.5rem 0 0 0; 
      padding: 0 1.2rem;
      line-height: 1.7;
    }
    
    .faq-item input:checked ~ .faq-body {
      max-height: 300px; 
      padding: 1.2rem;
    }
    
    .faq-item label:after {
      content: "+"; 
      float: left; 
      color: #58cac0; 
      font-size: 1.3rem; 
      margin-left: 0.5rem;
      font-weight: 700;
    }
    
    .faq-item input:checked + label:after {
      content: "–";
    }
    
    .faq-item input:checked + label {
      background: rgba(24, 114, 114, 0.2);
      border-color: rgba(88, 202, 192, 0.4);
    }
    
    /* Mockup Box */
    .mockupbox { 
      max-width: 700px;
      width: 90vw;
      margin: 1rem auto;
      background: rgba(13, 24, 24, 0.85);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      text-align: center;
      box-sizing: border-box;
    }
    
    .mockup-title { 
      color: #58cac0; 
      font-weight: 800; 
      font-size: 1.5rem; 
      margin-bottom: 1.5rem;
    }
    
    .mockup-imgs { 
      display:flex; 
      flex-wrap:wrap; 
      gap:0.7rem; 
      justify-content:center; 
    }
    
    .mockup-imgs img { 
      border-radius:1rem; 
      box-shadow:0 2px 10px #18727233; 
      width:120px; 
      max-width:32vw; 
      background:#fff;
      cursor: pointer;
    }
    
    .mockup-caption { 
      color:#BFEAE5; 
      font-size:.96rem; 
      margin-top:1rem;
    }
    
    /* Modal */
    .modal {
      display: none;
      position: fixed;
      z-index: 1000;
      padding-top: 60px;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.9);
    }
    
    .modal-content {
      margin: auto;
      display: block;
      width: 80%;
      max-width: 700px;
    }
    
    .close {
      position: absolute;
      top: 15px;
      right: 35px;
      color: #f1f1f1;
      font-size: 40px;
      font-weight: bold;
      transition: 0.3s;
      cursor: pointer;
    }
    
    .close:hover, .close:focus {
      color: #bbb;
      text-decoration: none;
    }
    
    /* Carousel Styles */
    .carousel-container {
      position: relative;
      max-width: 100%;
      margin: 0 auto;
      border-radius: 1.2rem;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(24, 114, 114, 0.4);
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .carousel-wrapper {
      position: relative;
      width: 100%;
      height: 600px;
    }
    
    .carousel-slide {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    }
    
    .carousel-slide.active {
      opacity: 1;
    }
    
    .carousel-slide img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 1rem;
      background: rgba(255,255,255,0.05);
    }
    
    .slide-caption {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0,0,0,0.8));
      color: white;
      padding: 1rem;
      text-align: center;
      font-weight: bold;
    }
    
    .carousel-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(0,0,0,0.5);
      color: white;
      border: none;
      padding: 1rem;
      cursor: pointer;
      font-size: 1.2rem;
      border-radius: 0.5rem;
      transition: background 0.3s;
      z-index: 10;
    }
    
    .carousel-btn:hover {
      background: rgba(0,0,0,0.8);
    }
    
    .carousel-btn.prev {
      left: 10px;
    }
    
    .carousel-btn.next {
      right: 10px;
    }
    
    .carousel-dots {
      text-align: center;
      margin-top: 1rem;
    }
    
    .dot {
      height: 12px;
      width: 12px;
      margin: 0 5px;
      background-color: rgba(255,255,255,0.3);
      border-radius: 50%;
      display: inline-block;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .dot.active, .dot:hover {
      background-color: #58cac0;
    }
    
    /* Video Reviews Section */
    .video-reviews-section {
      max-width: 700px;
      width: 90vw;
      margin: 1rem auto;
      background: rgba(13, 24, 24, 0.85);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      text-align: center;
      box-sizing: border-box;
    }
    
    .video-reviews-title {
      color: #58cac0;
      font-weight: 800;
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .video-container {
      position: relative;
      width: 100%;
      max-width: 360px;
      aspect-ratio: 9 / 16;
      margin: 0 auto;
      border-radius: 1.2rem;
      overflow: hidden;
      box-shadow: 0 6px 25px rgba(24, 114, 114, 0.4);
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .video-container video {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 1rem;
      object-fit: contain;
    }
    
    /* Footer */
    .mainfooter {
      max-width: 500px;
      width: 90vw;
      margin: 1rem auto 1.5rem auto;
      background: rgba(13, 24, 24, 0.85);
      border: 2px solid rgba(255,255,255,0.11);
      border-radius: 2.2rem;
      padding: 2rem 1.3rem;
      box-shadow: 0 8px 40px 0 rgba(24, 114, 114, 0.18);
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      text-align: center;
      color: #BFEAE5;
      font-size: 1rem;
      box-sizing: border-box;
    }
    
    .mainfooter a {
      text-decoration: none;
      color: #58cac0;
      font-weight: 600;
    }
    
    .mainfooter a:hover {
      color: #26fce3;
      text-decoration: underline;
    }
    
    /* Floating CTA Button */
    .floating-cta-btn {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      background: #2ABF1B;
      color: #fff;
      font-size: 1.5rem;
      font-weight: 800;
      padding: 1.4rem 1.5rem;
      text-align: center;
      text-decoration: none;
      display: block;
      z-index: 9999;
      box-shadow: 0 -4px 20px rgba(42, 191, 27, 0.4);
      border: none;
      border-top: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 1.5rem 1.5rem 0 0;
      transition: all 0.3s ease;
      box-sizing: border-box;
      cursor: pointer;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
    }
    
    .floating-cta-btn:hover {
      background: #25a816;
      box-shadow: 0 -6px 30px rgba(42, 191, 27, 0.6);
      transform: translateY(-2px);
    }
    
    .floating-cta-btn:active {
      transform: translateY(0);
    }
    
    /* Payment Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      z-index: 10000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      overflow: hidden;
      animation: fadeIn 0.3s ease;
      box-sizing: border-box;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    .modal-overlay.active {
      display: flex;
    }
    
    .modal-container {
      background: linear-gradient(135deg, rgba(10, 10, 10, 0.98), rgba(12, 22, 22, 0.98));
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-radius: 2rem;
      width: 100%;
      max-width: 24rem;
      max-height: 70vh;
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.8),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      overflow: hidden;
      position: relative;
      animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      margin: auto;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .modal-header {
      position: relative;
      padding: 2rem 2rem 1.5rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      background: linear-gradient(180deg, rgba(24, 114, 114, 0.1), transparent);
    }
    
    .modal-header-content {
      position: relative;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: row-reverse;
    }
    
    .modal-title {
      font-size: 1.6rem;
      font-weight: 900;
      background: linear-gradient(135deg, #58cac0, #26fce3, #187272);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      letter-spacing: -0.01em;
      text-align: right;
    }
    
    .modal-subtitle {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: right;
    }
    
    .modal-close-btn {
      padding: 0.5rem;
      width: 2.25rem;
      height: 2.25rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .modal-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: #fff;
    }
    
    .modal-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    
    .modal-content {
      padding: 2rem;
      overflow-y: auto;
      overflow-x: hidden;
      flex: 1;
      box-sizing: border-box;
      min-height: 0;
      max-height: 100%;
      -webkit-overflow-scrolling: touch;
    }
    
    .modal-content::-webkit-scrollbar {
      width: 6px;
    }
    
    .modal-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }
    
    .modal-content::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }
    
    .modal-content::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    .modal-step {
      display: none;
    }
    
    .modal-step.active {
      display: block;
    }
    
    /* Step 1: User Info Form */
    .form-group {
      margin-bottom: 1.75rem;
    }
    
    .form-group:last-child {
      margin-bottom: 0;
    }
    
    .form-label {
      display: block;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      text-align: right;
    }
    
    .form-input {
      width: 100%;
      padding: 1rem 1.25rem;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 1rem;
      color: #fff;
      font-size: 1rem;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-sizing: border-box;
      font-weight: 500;
      text-align: right;
      direction: rtl;
    }
    
    .form-input:focus {
      outline: none;
      border-color: rgba(24, 114, 114, 0.6);
      background: rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 0 0 4px rgba(24, 114, 114, 0.15),
        0 4px 12px rgba(24, 114, 114, 0.2);
      transform: translateY(-1px);
    }
    
    .form-input:hover {
      border-color: rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.08);
    }
    
    .form-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
      font-weight: 400;
    }
    
    /* Step 2: Cart */
    .cart-item {
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
    }
    
    .cart-item-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-direction: row-reverse;
    }
    
    .cart-icon {
      width: 2.75rem;
      height: 2.75rem;
      background: linear-gradient(135deg, #187272, #2a9c96);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .cart-item-title {
      font-weight: 700;
      color: #fff;
      font-size: 1.15rem;
      margin-bottom: 0.25rem;
      text-align: right;
    }
    
    .cart-item-subtitle {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.875rem;
      font-weight: 400;
      text-align: right;
    }
    
    .flex-1 {
      flex: 1;
    }
    
    .space-y-3 > * + * {
      margin-top: 0.75rem;
    }
    
    .cart-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.875rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      flex-direction: row-reverse;
    }
    
    .cart-price-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: right;
    }
    
    .cart-price-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #fff;
      text-align: right;
      direction: rtl;
    }
    
    .payment-methods {
      margin-bottom: 1rem;
    }
    
    .payment-methods-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.75rem;
      text-align: right;
    }
    
    .payment-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 0.85rem;
      border-radius: 0.625rem;
      border: 1px solid rgba(255, 255, 255, 0.08);
      cursor: pointer;
      margin-bottom: 0.75rem;
      transition: all 0.2s;
      background: rgba(255, 255, 255, 0.02);
      flex-direction: row-reverse;
      direction: rtl;
      max-width: 100%;
      width: 100%;
      box-sizing: border-box;
    }
    
    .payment-option:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(42, 156, 150, 0.4);
    }
    
    .payment-radio {
      width: 1.1rem;
      height: 1.1rem;
      accent-color: #2a9c96;
      cursor: pointer;
    }
    
    .payment-option-content {
      flex: 1;
      text-align: right;
      direction: rtl;
    }
    
    .payment-option-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 0.3rem;
      justify-content: flex-start;
      direction: rtl;
    }
    
    .payment-option-badge {
      font-size: 0.75rem;
      color: #4ade80;
      font-weight: 500;
    }
    
    .payment-option-desc {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.65);
      font-weight: 500;
      text-align: right;
      direction: rtl;
    }
    
    .price-summary {
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
    }
    
    .price-row {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.625rem;
      gap: 0.5rem;
    }
    
    .price-row-total {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 0.625rem;
      margin-top: 0.625rem;
    }
    
    .price-label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
      font-weight: 500;
      text-align: center;
      width: 100%;
    }
    
    .price-value {
      color: #fff;
      font-weight: 800;
      font-size: 2.2rem;
      text-align: center;
      direction: ltr;
      width: 100%;
      display: block;
    }
    
    .price-value-total {
      font-size: 2.5rem;
      font-weight: 900;
      color: #fff;
      text-align: center;
      direction: ltr;
      width: 100%;
      display: block;
    }
    
    .price-label.price-value-total {
      font-size: 1.5rem;
      font-weight: 800;
      text-align: center;
      width: 100%;
    }
    
    /* Card to Card Info */
    .card-to-card-info {
      border-radius: 1rem;
      padding: 0.75rem 0.875rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1rem;
      background: rgba(10, 20, 20, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .card-info-header {
      text-align: center;
      margin-bottom: 0.75rem;
    }
    
    .card-info-icon {
      width: 3rem;
      height: 3rem;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.4rem;
      color: #fff;
    }
    
    .card-info-icon svg {
      width: 24px;
      height: 24px;
    }
    
    .card-info-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .card-info-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .card-info-item {
      background: rgba(31, 41, 55, 0.5);
      border-radius: 0.75rem;
      padding: 0.75rem 0.875rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-direction: row;
      box-sizing: border-box;
      min-width: 0;
      gap: 0.75rem;
      width: 100%;
      overflow: hidden;
    }
    
    .card-info-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.9rem;
      text-align: right;
      direction: rtl;
      word-wrap: break-word;
      overflow-wrap: break-word;
      flex-shrink: 0;
      min-width: fit-content;
    }
    
    .card-info-value {
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      text-align: left;
      direction: rtl;
      word-wrap: break-word;
      overflow-wrap: break-word;
      flex: 1;
      min-width: 0;
    }
    
    .card-number-wrapper {
      margin-bottom: 0;
      margin-top: 0;
    }
    
    .card-number-box {
      background: rgba(31, 41, 55, 0.5);
      border-radius: 0.75rem;
      padding: 0.875rem 0.75rem;
      margin-bottom: 0.6rem;
      text-align: center;
      box-sizing: border-box;
      overflow: hidden;
    }
    
    .card-info-value.card-number {
      font-family: 'Courier New', monospace;
      font-weight: 800;
      letter-spacing: 0.05em;
      direction: ltr;
      text-align: center;
      white-space: nowrap;
      color: #fff;
      font-size: 1.1rem;
      display: block;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .copy-card-btn {
      width: 100%;
      height: 2.75rem;
      padding: 0;
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      border: none;
      border-radius: 0.75rem;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      white-space: nowrap;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    
    .copy-card-btn:hover {
      background: linear-gradient(135deg, #059669, #047857);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.5);
    }
    
    .copy-card-btn:active {
      opacity: 0.9;
    }
    
    .copy-card-btn.copied {
      background: linear-gradient(135deg, #10b981, #059669);
    }
    
    .copy-success {
      position: absolute;
      background: rgba(16, 185, 129, 0.9);
      color: #fff;
      padding: 0.3rem 0.6rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      top: -2rem;
      right: 0;
      white-space: nowrap;
      animation: fadeInOut 2s ease;
      pointer-events: none;
    }
    
    @keyframes fadeInOut {
      0%, 100% { opacity: 0; transform: translateY(0); }
      10%, 90% { opacity: 1; transform: translateY(-5px); }
    }
    
    .card-info-note {
      background: rgba(5, 46, 22, 0.6);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 0.75rem;
      padding: 1rem 0.875rem;
      text-align: center;
      font-size: 0.9rem;
      color: #BFEAE5;
      margin-top: 0.5rem;
      line-height: 1.7;
      word-wrap: break-word;
      overflow-wrap: break-word;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .card-info-note-text {
      color: #BFEAE5;
      font-size: 0.9rem;
      line-height: 1.6;
      text-align: right;
      direction: rtl;
    }
    
    .card-info-link {
      color: #10b981;
      font-weight: 800;
      text-decoration: none;
      background: rgba(16, 185, 129, 0.25);
      padding: 0.6rem 1rem;
      border-radius: 0.5rem;
      display: inline-block;
      margin: 0 auto;
      transition: all 0.2s;
      border: 1px solid rgba(16, 185, 129, 0.3);
      font-size: 0.95rem;
      letter-spacing: 0.02em;
    }
    
    .card-info-link:hover {
      color: #10b981;
      background: rgba(16, 185, 129, 0.35);
      border-color: rgba(16, 185, 129, 0.5);
      transform: translateY(-1px);
    }
    
    .installment-description {
      margin-bottom: 0.75rem;
    }
    
    .installment-note-box {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 0.75rem;
      padding: 0.875rem;
      margin-top: 0.6rem;
      margin-bottom: 0.5rem;
    }
    
    .modal-footer {
      padding: 1.5rem 2rem 2rem 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: transparent;
      flex-shrink: 0;
    }
    
    .btn-primary {
      width: 100%;
      padding: 1.15rem 1.5rem;
      border-radius: 1rem;
      font-weight: 800;
      font-size: 1.1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(135deg, #26A817, #1f8a14);
      color: #fff;
      border: none;
      cursor: pointer;
      box-shadow: 
        0 4px 16px rgba(38, 168, 23, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1);
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      letter-spacing: 0.02em;
      position: relative;
      overflow: hidden;
    }
    
    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }
    
    .btn-primary:hover::before {
      left: 100%;
    }
    
    .btn-primary:hover {
      background: linear-gradient(135deg, #1f8a14, #1a7511);
      transform: translateY(-2px);
      box-shadow: 
        0 8px 24px rgba(38, 168, 23, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.15);
    }
    
    .btn-primary:active {
      transform: translateY(0);
      box-shadow: 
        0 2px 8px rgba(38, 168, 23, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    
    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .btn-next {
      background: linear-gradient(135deg, #187272, #2a9c96);
      box-shadow: 0 4px 12px rgba(42, 156, 150, 0.3);
    }
    
    .btn-next:hover {
      background: linear-gradient(135deg, #2a9c96, #58cac0);
      box-shadow: 0 6px 16px rgba(42, 156, 150, 0.4);
    }
    
    .btn-submit-receipt {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .btn-submit-receipt:hover {
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      .container, .compare-section, .countdownbox, .features-click-reveal, .faqbox, .mockupbox, .video-reviews-section, .mainfooter, .payment-options-banner {
        width: 88vw;
        padding: 1.8rem 1rem;
      }
      
      .payment-options-banner {
        padding: 0;
        margin: 1rem auto;
      }
      
      .payment-options-link {
        font-size: 1.05rem;
        padding: 1rem 2rem;
      }
      
      h1 .brand-name { font-size: 3.5rem; }
      h1 .subtitle { font-size: 1.6rem; }
      .desc { font-size: 1rem; }
      .cta-btn { font-size: 1.05rem; padding: 1rem 2.2rem; }
      .discount-badge { font-size: 0.9rem; padding: 0.6rem 1.1rem; }
      
      .compare-section h2, .features-click-reveal h2, .faq-title, .mockup-title, .video-reviews-title {
        font-size: 1.3rem;
      }
      
      .video-container {
        width: 90%;
        max-width: 360px;
        aspect-ratio: 9 / 16;
      }
      
      .video-container video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .countdown-title { font-size: 1.05rem; }
      #countdown { gap: 1rem; padding: 1.5rem 2rem; }
      #countdown span { min-width: 75px; }
      #countdown span:not(:last-child)::after { font-size: 2.5rem; right: -0.5rem; }
      #countdown b { font-size: 3.2rem; }
      
      .badge { font-size: 0.9rem; padding: 0.65rem 1rem; }
      .feature-item { padding: 0.8rem; }
      .feature-header { font-size: 0.9rem; }
      
      .floating-cta-btn {
        font-size: 1.3rem;
        padding: 1.2rem 1.2rem;
      }
      
      .modal-overlay {
        padding: 0.5rem;
      }
      
      .modal-container {
        max-width: 95%;
        width: calc(100% - 1rem);
        max-height: 70vh;
        border-radius: 1.5rem;
        margin: auto;
      }
      
      .modal-header {
        padding: 1.25rem 1.5rem;
      }
      
      .modal-content {
        padding: 0.875rem 1rem;
      }
      
      .modal-title {
        font-size: 1.3rem;
      }
      
      .modal-subtitle {
        font-size: 0.8rem;
      }
      
      .form-input {
        padding: 0.875rem 1rem;
        font-size: 0.95rem;
      }
      
      .cart-item {
        padding: 1.125rem;
      }
      
      .cart-icon {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.15rem;
      }
      
      .cart-item-title {
        font-size: 1.05rem;
      }
      
      .cart-price-value {
        font-size: 1.35rem;
      }
      
      .payment-methods-title {
        font-size: 1rem;
      }
      
      .payment-option {
        padding: 0.875rem;
      }
      
      .price-summary {
        padding: 1.125rem;
      }
      
      .price-value {
        font-size: 1.8rem;
      }
      
      .price-value-total {
        font-size: 2rem;
      }
      
      .modal-footer {
        padding: 1.25rem 1.5rem;
      }
      
      .btn-primary {
        font-size: 1rem;
        padding: 0.95rem 1.25rem;
      }
    }
    
    @media (max-width: 480px) {
      .container, .compare-section, .countdownbox, .features-click-reveal, .faqbox, .mockupbox, .video-reviews-section, .mainfooter, .payment-options-banner {
        width: 86vw;
        padding: 1.5rem 0.9rem;
        border-radius: 1.8rem;
      }
      
      .payment-options-banner {
        padding: 0;
        margin: 1rem auto;
      }
      
      .payment-options-link {
        font-size: 1rem;
        padding: 0.9rem 1.8rem;
      }
      
      h1 .brand-name { font-size: 3rem; }
      h1 .subtitle { font-size: 1.5rem; }
      .desc { font-size: 0.95rem; }
      .cta-btn { font-size: 1rem; padding: 0.9rem 2rem; }
      .discount-badge { font-size: 0.85rem; padding: 0.5rem 1rem; }
      
      .compare-section h2, .features-click-reveal h2, .faq-title, .mockup-title, .video-reviews-title {
        font-size: 1.2rem;
      }
      
      .countdown-title { font-size: 0.95rem; }
      #countdown { font-size: 1rem; gap: 0.8rem; padding: 1.2rem 1.5rem; }
      #countdown span { min-width: 65px; font-size: 0.7rem; }
      #countdown span:not(:last-child)::after { font-size: 2rem; right: -0.4rem; }
      #countdown b { font-size: 2.8rem; }
      
      .badge { font-size: 0.85rem; padding: 0.6rem 0.9rem; }
      .feature-item { padding: 0.7rem; font-size: 0.9rem; }
      .feature-header { font-size: 0.85rem; }
      .feature-description { font-size: 0.85rem; }
      
      .compare-table .row { padding: 0.7rem 0.8rem; font-size: 0.85rem; }
      .compare-table .row.header { font-size: 0.95rem; }
      
      .carousel-wrapper { height: 450px; }
      .carousel-btn { padding: 0.8rem; font-size: 1rem; }
      
      .floating-cta-btn {
        font-size: 1.2rem;
        padding: 1.1rem 1rem;
      }
      
      .modal-overlay {
        padding: 0.5rem;
      }
      
      .modal-container {
        max-width: 96%;
        width: calc(100% - 1rem);
        max-height: 70vh;
        border-radius: 1.25rem;
        margin: auto;
      }
      
      .card-info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
      
      .card-info-label {
        width: 100%;
        margin-bottom: 0.25rem;
      }
      
      .card-info-value {
        width: 100%;
        text-align: right;
      }
      
      .modal-header {
        padding: 1.25rem 1.25rem;
      }
      
      .modal-content {
        padding: 0.875rem 1rem;
      }
      
      .modal-title {
        font-size: 1.3rem;
      }
      
      .cart-item {
        padding: 1.25rem;
      }
      
      .cart-item-title {
        font-size: 1.15rem;
      }
      
      .cart-price-value {
        font-size: 1.35rem;
      }
      
      .price-value {
        font-size: 1.8rem;
      }
      
      .price-value-total {
        font-size: 2rem;
      }
      
      .btn-primary {
        font-size: 1.05rem;
        padding: 1rem 1.25rem;
      }
      
      .card-to-card-info {
        padding: 0.625rem 0.7rem;
      }
      
      .card-info-icon {
        width: 2.5rem;
        height: 2.5rem;
      }
      
      .card-info-icon svg {
        width: 18px;
        height: 18px;
      }
      
      .card-info-title {
        font-size: 1rem;
      }
      
      .card-info-item {
        padding: 0.6rem 0.7rem;
      }
      
      .card-info-label {
        font-size: 0.8rem;
      }
      
      .card-info-value {
        font-size: 0.85rem;
      }
      
      .card-number-box {
        padding: 0.7rem 0.6rem;
      }
      
      .card-info-value.card-number {
        font-size: 0.9rem;
      }
      
      .copy-card-btn {
        font-size: 0.8rem;
        height: 2.5rem;
        padding: 0;
      }
      
      .card-info-note {
        padding: 0.7rem 0.6rem;
        font-size: 0.8rem;
      }
    }
    
    @media (max-width: 400px) {
      .container, .compare-section, .countdownbox, .features-click-reveal, .faqbox, .mockupbox, .video-reviews-section, .mainfooter, .payment-options-banner {
        width: 85vw;
        padding: 1.3rem 0.8rem;
      }
      
      .payment-options-banner {
        padding: 0;
        margin: 1rem auto;
      }
      
      .payment-options-link {
        font-size: 0.95rem;
        padding: 0.85rem 1.5rem;
      }
      
      h1 .brand-name { font-size: 2.5rem; }
      h1 .subtitle { font-size: 1.3rem; }
      .desc { font-size: 0.9rem; }
      .discount-badge { font-size: 0.8rem; padding: 0.5rem 0.9rem; }
      
      #countdown { gap: 0.6rem; padding: 1rem 1.2rem; }
      #countdown span { min-width: 55px; font-size: 0.65rem; }
      #countdown span:not(:last-child)::after { font-size: 1.8rem; right: -0.3rem; }
      #countdown b { font-size: 2.2rem; }
      
      .carousel-wrapper { height: 400px; }
      
      .feature-item { padding: 0.6rem; font-size: 0.85rem; }
      .feature-header { font-size: 0.8rem; }
      .feature-description { font-size: 0.8rem; }
      
      .floating-cta-btn {
        font-size: 1.1rem;
        padding: 1rem 0.9rem;
      }
      
      .modal-overlay {
        padding: 0.25rem;
      }
      
      .modal-container {
        max-width: 98%;
        width: calc(100% - 0.5rem);
        max-height: 70vh;
        border-radius: 1.5rem;
        margin: auto;
      }
      
      .card-info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.4rem;
        padding: 0.6rem 0.6rem;
      }
      
      .card-info-label {
        width: 100%;
        margin-bottom: 0.2rem;
        font-size: 0.75rem;
      }
      
      .card-info-value {
        width: 100%;
        text-align: right;
        font-size: 0.8rem;
      }
      
      .payment-option {
        max-width: 100%;
        margin-left: 0;
        margin-right: 0;
      }
      
      .modal-header {
        padding: 1.125rem 1.25rem;
      }
      
      .modal-content {
        padding: 0.75rem 0.875rem;
      }
      
      .modal-title {
        font-size: 1.15rem;
      }
      
      .modal-subtitle {
        font-size: 0.75rem;
      }
      
      .form-input {
        padding: 0.8rem 0.95rem;
        font-size: 0.9rem;
      }
      
      .cart-item {
        padding: 1rem;
      }
      
      .cart-icon {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.1rem;
      }
      
      .cart-item-title {
        font-size: 1rem;
      }
      
      .cart-price-value {
        font-size: 1.25rem;
      }
      
      .payment-methods-title {
        font-size: 0.95rem;
      }
      
      .payment-option {
        padding: 0.875rem;
      }
      
      .price-summary {
        padding: 1rem;
      }
      
      .price-value-total {
        font-size: 1.25rem;
      }
      
      .modal-footer {
        padding: 1.125rem 1.25rem;
      }
      
      .btn-primary {
        font-size: 0.95rem;
        padding: 0.9rem 1.15rem;
      }
      
      .date-value {
        font-size: 1rem;
      }
      
      .card-to-card-info {
        padding: 0.625rem 0.75rem;
      }
      
      .card-info-icon {
        width: 2.75rem;
        height: 2.75rem;
      }
      
      .card-info-icon svg {
        width: 20px;
        height: 20px;
      }
      
      .card-info-title {
        font-size: 1.05rem;
      }
      
      .card-info-item {
        padding: 0.625rem 0.75rem;
      }
      
      .card-info-label {
        font-size: 0.85rem;
      }
      
      .card-info-value {
        font-size: 0.9rem;
      }
      
      .card-number-box {
        padding: 0.75rem 0.625rem;
      }
      
      .card-info-value.card-number {
        font-size: 0.95rem;
        letter-spacing: 0.03em;
      }
      
      .copy-card-btn {
        font-size: 0.85rem;
        height: 2.6rem;
        padding: 0;
      }
      
      .card-info-note {
        padding: 0.75rem 0.625rem;
        font-size: 0.85rem;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-ai">
      <img src="/logo.JPG" alt="Monetize AI Logo" />
    </div>
    
    <h1>
      <span class="brand-name">MonetizeAI</span>
      <span class="subtitle">سیستم پولسازی خودکار با هوش مصنوعی</span>
    </h1>
    
    <div class="desc">
      اولین هوش مصنوعی درآمدزایی با هوش مصنوعی
    </div>
    
    <div class="features-wrapper">
      <div class="features-list">
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">⭐️ تیم هوش مصنوعی ۱۰ نفره (۲۴/۷)</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">همه کارهایی که باید خودت انجام بدی، از ایده تا فروش، توسط یک تیم هوشمند انجام میشه؛ انگار ده‌تا متخصص همیشه پشت‌صحنه دارن برای درآمد تو کار می‌کنن.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">⚡️ ساخت سیستم پولسازی بدون مهارت</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">فقط با موبایل، مرحله‌به‌مرحله جلو می‌ری و یه سیستم درآمدزایی واقعی می‌سازی… بدون اینکه لازم باشه چیزی بلد باشی.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">🔥 اتومات‌سازی کامل مسیر درآمد</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">تولید محتوا، پیدا کردن مشتری، فالوآپ، فروش… بخش زیادی از کار کاملاً خودکار انجام میشه. تو فقط نتیجه رو می‌گیری.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">🧠 آی ای کوچ شخصی سازی شده</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">هر سؤالی داشته باشی، هر مرحله‌ای گیر کنی، مربی هوشمند شخصی‌سازی‌شده راهکار آماده می‌ده؛ انگار خود سازنده ۲۴ ساعته همراهته.</div>
        </div>
        
        <div class="feature-item" onclick="this.classList.toggle('active')">
          <div class="feature-header">
            <div class="feature-text">🎯 مسیر ۹ سطحی ساخت اولین درآمد واقعی</div>
            <div class="arrow">▶</div>
          </div>
          <div class="feature-description">به‌جای ماه‌ها سردرگمی، مسیری داری که از صفر تا رسیدن به درآمد مشخص و تست‌شده‌ست؛ فقط طبق مراحل میری جلو و نتیجه می‌گیری.</div>
        </div>
      </div>
    </div>
    
    <div class="pricebox">
      <span class="price-old">۷.۵ میلیون</span>
      <span class="price-value">۴,۹۰۰,۰۰۰ تومان</span>
      <div class="price-desc">
        فقط با <b>۴,۹۰۰,۰۰۰ تومان</b> صاحب لایف‌تایم شو!
      </div>
      <div class="discount-badge">تخفیف ویژه فقط برای ۳۰۰ نفر اول</div>
    </div>
  </div>
  
  <!-- Payment Options Link -->
  <div class="payment-options-banner">
    <a href="#" class="payment-options-link" onclick="openPaymentOptionsModal(); return false;">
      💳 کارت به کارت و خرید قسطی
    </a>
  </div>
  
  <!-- Compare Section -->
  <section class="compare-section">
    <h2>⚔️ مقایسه قبل و بعد از مانتیاز</h2>
    <div class="compare-table">
      <div class="row header">
        <div class="cell">قبل از مانتیاز</div>
        <div class="cell">بعد از مانتیاز</div>
      </div>
      <div class="row">
        <div class="cell">سردرگم، بی‌مسیر</div>
        <div class="cell">مسیر دقیق و مرحله‌به‌مرحله</div>
      </div>
      <div class="row">
        <div class="cell">شروع از صفر هر روز</div>
        <div class="cell">سیستم خودکار همیشه روشن</div>
      </div>
      <div class="row">
        <div class="cell">ایده‌های حدسی و نامطمئن</div>
        <div class="cell">ایده‌های پولساز بر اساس داده واقعی</div>
      </div>
      <div class="row">
        <div class="cell">تولید محتوا و فروش با شانس</div>
        <div class="cell">محتوا و فروش هوشمند با AI</div>
      </div>
      <div class="row">
        <div class="cell">ده تا ابزار، ده تا هزینه</div>
        <div class="cell">همه‌چیز یک‌جا، یک سیستم واحد</div>
      </div>
    </div>
    <p class="note">📌 این فقط یه آموزش نیست؛ این یه بازی جدیه که تهش پول درمیاری!</p>
  </section>
  
  <!-- Countdown Box -->
  <div class="countdownbox">
    <div class="countdown-title">⏰ فرصت ویژه فقط تا پایان تخفیف!</div>
    <div id="countdown" dir="ltr">
      <span><b id="days">0</b>روز</span>
      <span><b id="hours">08</b>ساعت</span>
      <span><b id="minutes">00</b>دقیقه</span>
      <span><b id="seconds">00</b>ثانیه</span>
    </div>
  </div>
  
  <!-- Features Section -->
  <section class="features-click-reveal">
    <h2>🧠 دقیقاً چی دریافت می‌کنی؟</h2>
    <div class="hint">روی هر کادر بزن تا بیشتر بدونی 😉</div>
    <div class="badge-grid">
      <div class="badge" data-detail="کوچ هوشمند تو کل مسیر همراهته و بهت کمک میکنه کل مسیرو بسازی">🧠 کوچ هوشمند ۲۴/۷</div>
      <div class="badge" data-detail="تنها نمی‌مونی؛ هرجا گیر کردی راهنمایی فوری داری.">🤝 پشتیبانی دائمی</div>
      <div class="badge" data-detail="اسم، ساختار، مزیت؛ کل محصولت به‌صورت اتوماتیک ساخته می‌شه.">🛠 سرویس‌ساز خودکار</div>
      <div class="badge" data-detail="نقشه دقیق از صفر تا درآمد؛ فقط اجرا می‌کنی.">🎯 مسیر ۲۹ مرحله‌ای</div>
      <div class="badge" data-detail="کجا مشتری هست و چطور باید بهش بفروشی رو نشونت می‌ده.">🔍 مشتری‌یاب فوری</div>
      <div class="badge" data-detail="یه سیستم کامل که جای تو محتوا، پیام، فالوآپ و فروش رو انجام می‌ده.">⚙️ فروش خودکار</div>
      <div class="badge" data-detail="بدون اشتراک دلاری؛ همیشه فعال و نامحدود.">🔑 چت‌جی‌پی‌تی پلاس داخلی</div>
    </div>
    <div id="feature-detail-popup" class="popup"></div>
  </section>
  
  <!-- FAQ Section -->
  <div class="faqbox">
    <div class="faq-title">سوالات پرتکرار</div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq1"><label for="faq1">واقعاً می‌تونم با این سیستم پول دربیارم؟</label>
      <div class="faq-body">بله. مانیتایز‌اِی‌آی آموزش تئوری نیست؛ یه سیستم عملیه که از انتخاب ایده تا ساخت سرویس، تولید محتوا و جذب مشتری رو اتوماتیک برات انجام می‌ده.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq2"><label for="faq2">من مهارتی ندارم؛ بازم می‌تونم؟</label>
      <div class="faq-body">کاملاً. هدف مانیتایز ای آی همینه که کل اتفاقات به دست هوش مصنوعی انجام بشه شما فقط قدم به قدم بر اساس مراحل میری جلو</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq3"><label for="faq3">هزینه‌ی ماهانه یا اشتراک دلاری داره؟</label>
      <div class="faq-body">نه. اشتراک مانیتایز‌اِی‌آی مادام‌العمره و همه ابزارها + کوچ هوشمند + مسیر ۲۹ مرحله‌ای با یک پرداخت فعال می‌شه. هیچ هزینه پنهان یا اشتراک دلاری نداره.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq4"><label for="faq4">فالوئر کم دارم؛ چطور مشتری پیدا کنم؟</label>
      <div class="faq-body">نیازی به فالوئر نیست. ابزار مشتری‌یاب فوری در مانیتایز‌اِی‌آی نشون می‌ده مشتری واقعی کجاست و چطور باید بهش برسی. فروش از فالوئر نیست؛ از نیاز بازاره.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq5"><label for="faq5">من بلد نیستم محتوا بسازم؛ چی کار کنم؟</label>
      <div class="faq-body">نگران نباش. مانیتایز‌اِی‌آی خودش محتوا تولید می‌کنه: سناریو، ایده، کپشن، ساخت ویدیو، و حتی وایرال‌سازی تو همه اینا بهت کمک میکنه. تو فقط کافی‌یه اجرا کنی.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq6"><label for="faq6">اگه وسط مسیر گیر کنم؟ پشتیبانی دارم؟</label>
      <div class="faq-body">بله. کوچ هوشمند ۲۴/۷ همیشه همراهته و هرجا گیر کردی راه رو نشون می‌ده. علاوه بر اون، پشتیبانی انسانی هم داری. هیچ‌وقت تنها نمی‌مونی.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq7"><label for="faq7">چند روز طول می‌کشه به درآمد برسم؟</label>
      <div class="faq-body">به اجرای تو بستگی داره، ولی کاربران معمولاً بین ۲۰ تا ۴۵ روز اولین فروششون رو می‌زنن. مسیر طوری طراحی شده که سریع‌ترین نتیجه ممکن رو بده.</div>
    </div>
    
    <div class="faq-item">
      <input type="checkbox" id="faq8"><label for="faq8">فرق این پلتفرم با دوره‌های هوش مصنوعی چیه؟</label>
      <div class="faq-body">این دوره نیست. این یه سیستم کامل پولسازیه: ابزار داره، کوچ داره، مسیر داره، اتوماسیون داره، محتوا می‌سازه، سرویس می‌سازه، فروش می‌کنه. جایی که بقیه فقط «یاد می‌دن»، مانیتایز‌اِی‌آی «می‌سازه» و «اجرا می‌کنه».</div>
    </div>
  </div>
  
  <!-- Mockup Box with Carousel -->
  <div class="mockupbox">
    <div class="mockup-title">داخل MonetizeAI چه شکلیه؟</div>
    
    <div class="carousel-container">
      <div class="carousel-wrapper">
        <div class="carousel-slide active">
          <img src="/ابزار های هوشمند.png" alt="ابزارهای هوشمند">
          <div class="slide-caption">ابزارهای هوشمند</div>
        </div>
        <div class="carousel-slide">
          <img src="/داشبورد.png" alt="داشبورد">
          <div class="slide-caption">داشبورد</div>
        </div>
        <div class="carousel-slide">
          <img src="/دستیار هوش مصنوعی.png" alt="دستیار هوش مصنوعی">
          <div class="slide-caption">دستیار هوش مصنوعی</div>
        </div>
        <div class="carousel-slide">
          <img src="/دوره های ویژه.png" alt="دوره های ویژه">
          <div class="slide-caption">دوره های ویژه</div>
        </div>
        <div class="carousel-slide">
          <img src="/مراحل قدم به قدم.png" alt="مراحل قدم به قدم">
          <div class="slide-caption">مراحل قدم به قدم</div>
        </div>
        <div class="carousel-slide">
          <img src="/پروفایل و پشتیبانی ۲۴ ساعته.png" alt="پروفایل و پشتیبانی ۲۴ ساعته">
          <div class="slide-caption">پروفایل و پشتیبانی ۲۴ ساعته</div>
        </div>
      </div>
      
      <button class="carousel-btn prev" onclick="changeSlide(-1)">❮</button>
      <button class="carousel-btn next" onclick="changeSlide(1)">❯</button>
      
      <div class="carousel-dots">
        <span class="dot active" onclick="currentSlide(1)"></span>
        <span class="dot" onclick="currentSlide(2)"></span>
        <span class="dot" onclick="currentSlide(3)"></span>
        <span class="dot" onclick="currentSlide(4)"></span>
        <span class="dot" onclick="currentSlide(5)"></span>
        <span class="dot" onclick="currentSlide(6)"></span>
      </div>
    </div>
    
    <div class="mockup-caption">
      محیط واقعی MonetizeAI؛ حس پیشرفت مثل بازی و راحتی استفاده!
    </div>
  </div>
  
  <!-- Video Reviews Section -->
  <div class="video-reviews-section">
    <div class="video-reviews-title">نظرات افراد راجع به پلتفرم و حسین عباسیان</div>
    
    <div class="video-container">
      <video controls preload="metadata" playsinline>
        <source src="/+ویدئو رضایت.mp4" type="video/mp4">
        مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
      </video>
    </div>
  </div>
  
  <!-- Footer -->
  <footer class="mainfooter">
    <div class="footer-row">
      <span>© 2025 MonetizeAI • تمامی حقوق محفوظ است.</span>
    </div>
  </footer>
  
  <!-- Floating CTA Button -->
  <button class="floating-cta-btn" onclick="openPaymentModal()">
    تهیه اشتراک دائمی🚀
  </button>
  
  <!-- JavaScript -->
  <script>
    // Countdown Timer - 8 hours (always resets to 8 hours)
    (function () {
      const EIGHT_HOURS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
      const STORAGE_KEY = 'countdown_end_time';
      
      const $d = document.getElementById('days'),
            $h = document.getElementById('hours'),
            $m = document.getElementById('minutes'),
            $s = document.getElementById('seconds');
      
      // Get or set end time
      let endTime = localStorage.getItem(STORAGE_KEY);
      if (!endTime || Date.now() >= parseInt(endTime)) {
        // Set new end time (8 hours from now)
        endTime = Date.now() + EIGHT_HOURS;
        localStorage.setItem(STORAGE_KEY, endTime.toString());
      } else {
        endTime = parseInt(endTime);
      }
      
      function tick() {
        let diff = endTime - Date.now();
        
        // If time is up, reset to 8 hours
        if (diff <= 0) {
          endTime = Date.now() + EIGHT_HOURS;
          localStorage.setItem(STORAGE_KEY, endTime.toString());
          diff = EIGHT_HOURS;
        }
        
        const sec  = Math.floor(diff / 1000) % 60,
              min  = Math.floor(diff / 60000) % 60,
              hour = Math.floor(diff / 3600000) % 24,
              day  = Math.floor(diff / 86400000);
        
        $d.textContent = day;
        $h.textContent = hour.toString().padStart(2,'0');
        $m.textContent = min.toString().padStart(2,'0');
        $s.textContent = sec.toString().padStart(2,'0');
        
        requestAnimationFrame(tick);
      }
      tick();
    })();
    
    // Features Click Reveal
    document.querySelectorAll('.badge').forEach(badge => {
      badge.addEventListener('click', () => {
        const text = badge.getAttribute('data-detail');
        const popup = document.getElementById('feature-detail-popup');
        popup.textContent = text;
        popup.classList.add('visible');
      });
    });
    
    // Carousel functionality
    let slideIndex = 1;
    showSlide(slideIndex);
    
    // Auto slide every 4 seconds
    setInterval(() => {
      slideIndex++;
      if (slideIndex > 6) slideIndex = 1;
      showSlide(slideIndex);
    }, 4000);
    
    function changeSlide(n) {
      showSlide(slideIndex += n);
    }
    
    function currentSlide(n) {
      showSlide(slideIndex = n);
    }
    
    function showSlide(n) {
      let slides = document.getElementsByClassName("carousel-slide");
      let dots = document.getElementsByClassName("dot");
      
      if (n > slides.length) { slideIndex = 1; }
      if (n < 1) { slideIndex = slides.length; }
      
      for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
      }
      
      for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
      }
      
      if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].classList.add("active");
      }
      if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add("active");
      }
    }
  </script>
  
  <!-- Payment Modal -->
  <div class="modal-overlay" id="paymentModal">
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-header-content">
          <div>
            <h3 class="modal-title">🚀 تهیه اشتراک ویژه</h3>
            <p class="modal-subtitle">لطفاً اطلاعات خود را وارد کنید</p>
          </div>
          <button class="modal-close-btn" onclick="closePaymentModal()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="modal-body">
        <div class="modal-content">
          <div class="form-group">
            <label class="form-label">نام و نام خانوادگی</label>
            <input type="text" class="form-input" id="userName" placeholder="مثال: علی احمدی" required>
          </div>
          <div class="form-group">
            <label class="form-label">شماره تماس</label>
            <input type="tel" class="form-input" id="userPhone" placeholder="09123456789" required>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-primary" id="submitBtn" onclick="submitAndProceedToPayment()">ثبت و تهیه اشتراک ویژه</button>
      </div>
    </div>
  </div>
  
  <!-- Payment Options Modal -->
  <div class="modal-overlay" id="paymentOptionsModal">
    <div class="modal-container">
      <button class="modal-close-btn" onclick="closePaymentOptionsModal()" style="position: absolute; top: 1rem; left: 1rem; z-index: 100;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
      <div class="modal-body">
        <div class="modal-content">
          <div class="payment-methods">
            <h4 class="payment-methods-title">💳 انتخاب روش پرداخت</h4>
            <div class="space-y-3">
              <label class="payment-option">
                <input type="radio" name="paymentOption" class="payment-radio" value="card-to-card" checked>
                <div class="payment-option-content">
                  <div class="payment-option-title">
                    <span>کارت به کارت</span>
                  </div>
                  <p class="payment-option-desc">پرداخت کامل یکجا</p>
                </div>
              </label>
              <label class="payment-option">
                <input type="radio" name="paymentOption" class="payment-radio" value="installment">
                <div class="payment-option-content">
                  <div class="payment-option-title">
                    <span>خرید قسطی</span>
                  </div>
                  <p class="payment-option-desc">پرداخت در دو قسط</p>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Card to Card Info -->
          <div class="card-to-card-info" id="cardToCardInfoOption">
            <div class="card-info-header">
              <div class="card-info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                  <line x1="2" x2="22" y1="10" y2="10"></line>
                </svg>
              </div>
              <h4 class="card-info-title">اطلاعات کارت به کارت</h4>
            </div>
            <div class="card-info-content">
              <div class="card-info-item">
                <span class="card-info-label">مبلغ قابل پرداخت:</span>
                <span class="card-info-value">۴,۹۰۰,۰۰۰ تومان</span>
              </div>
              <div class="card-number-wrapper">
                <div class="card-number-box">
                  <span class="card-info-value card-number">5022-2913-2547-5315</span>
                </div>
                <button class="copy-card-btn" onclick="copyCardNumber(this, '5022-2913-2547-5315')">
                  📋 کپی
                </button>
              </div>
              <div class="card-info-item">
                <span class="card-info-label">به نام:</span>
                <span class="card-info-value">حسین عباسیان</span>
              </div>
              <div class="card-info-note">
                بعد از واریز برای فعال‌سازی، رسید واریزی رو به این آیدی تلگرام ارسال کنید: <a href="https://t.me/sian_academy_support" target="_blank" rel="noopener noreferrer" class="card-info-link">@sian_academy_support</a>
              </div>
            </div>
          </div>
          
          <!-- Installment Info -->
          <div class="card-to-card-info" id="installmentInfo" style="display: none;">
            <div class="card-info-header">
              <div class="card-info-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h4 class="card-info-title">خرید قسطی</h4>
            </div>
            <div class="card-info-content">
              <div class="installment-description">
                <p style="color: #BFEAE5; font-size: 0.95rem; line-height: 1.7; text-align: right; margin-bottom: 0.75rem;">
                  برای خرید قسطی، مبلغ <strong style="color: #58cac0;">۲,۴۵۰,۰۰۰ تومان</strong> به شماره کارت زیر واریز کنید. بعد از واریز، رسید را برای پشتیبانی ارسال کنید.
                </p>
              </div>
              <div class="card-info-item">
                <span class="card-info-label">مبلغ قسط اول:</span>
                <span class="card-info-value" style="color: #10b981;">۲,۴۵۰,۰۰۰ تومان</span>
              </div>
              <div class="card-number-wrapper">
                <div class="card-number-box">
                  <span class="card-info-value card-number">5022-2913-2547-5315</span>
                </div>
                <button class="copy-card-btn" onclick="copyCardNumber(this, '5022-2913-2547-5315')">
                  📋 کپی
                </button>
              </div>
              <div class="card-info-item">
                <span class="card-info-label">به نام:</span>
                <span class="card-info-value">حسین عباسیان</span>
              </div>
              <div class="installment-note-box">
                <p style="color: #fff; font-size: 0.9rem; line-height: 1.6; text-align: center; margin: 0;">
                  بعد از واریز، پلتفرم برای شما تا پرداخت قسط بعدی فعال می‌گردد
                </p>
              </div>
              <div class="card-info-note">
                بعد از واریز برای فعال‌سازی، رسید واریزی رو به این آیدی تلگرام ارسال کنید: <a href="https://t.me/sian_academy_support" target="_blank" rel="noopener noreferrer" class="card-info-link">@sian_academy_support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-primary" onclick="proceedToPaymentOption()">📤 ارسال رسید</button>
      </div>
    </div>
  </div>
  
  <script>
    let currentStep = 1;
    
    function openPaymentModal() {
      const modal = document.getElementById('paymentModal');
      modal.classList.add('active');
      // Lock body and html scroll when modal is open
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.__modalScrollY = scrollY;
      
      // Track click on "Permanent Subscription" button
      const registrationData = localStorage.getItem('registrationData');
      if (registrationData) {
        try {
          const data = JSON.parse(registrationData);
          if (data.phone) {
            console.log('[Tracking] Clicked on "Permanent Subscription" button');
            apiService.trackLandingActivity(data.phone, 'clicked_payment_button', data.firstName, data.lastName, {
              action: 'clicked_payment_button',
              button: 'تهیه اشتراک دائمی'
            });
          }
        } catch (e) {
          console.error('Failed to parse registration data:', e);
        }
      }
      
      // Check if user has already registered in workshop
      if (registrationData) {
        try {
          const data = JSON.parse(registrationData);
          const userName = (data.firstName && data.lastName) ? data.firstName + ' ' + data.lastName : '';
          const userPhone = data.phone || '';
          
          // Fill in the form fields
          const userNameInput = document.getElementById('userName');
          const userPhoneInput = document.getElementById('userPhone');
          if (userNameInput) userNameInput.value = userName;
          if (userPhoneInput) userPhoneInput.value = userPhone;
        } catch (e) {
          // If parsing fails, clear fields
          const userNameInput = document.getElementById('userName');
          const userPhoneInput = document.getElementById('userPhone');
          if (userNameInput) userNameInput.value = '';
          if (userPhoneInput) userPhoneInput.value = '';
        }
      } else {
        // No registration data, clear fields
        const userNameInput = document.getElementById('userName');
        const userPhoneInput = document.getElementById('userPhone');
        if (userNameInput) userNameInput.value = '';
        if (userPhoneInput) userPhoneInput.value = '';
      }
    }
    
    function closePaymentModal() {
      const modal = document.getElementById('paymentModal');
      modal.classList.remove('active');
      // Unlock body and html scroll when modal is closed
      const scrollY = window.__modalScrollY || 0;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, scrollY);
      delete window.__modalScrollY;
      // Reset form
      const userNameInput = document.getElementById('userName');
      const userPhoneInput = document.getElementById('userPhone');
      if (userNameInput) userNameInput.value = '';
      if (userPhoneInput) userPhoneInput.value = '';
    }
    
    async function submitAndProceedToPayment() {
      const userNameInput = document.getElementById('userName');
      const userPhoneInput = document.getElementById('userPhone');
      const submitBtn = document.getElementById('submitBtn');
      
      if (!userNameInput || !userPhoneInput) {
        alert('لطفاً تمام فیلدها را پر کنید');
        return;
      }
      
      const userName = userNameInput.value.trim();
      const userPhone = userPhoneInput.value.trim();
      
      if (!userName || !userPhone) {
        alert('لطفاً نام و شماره تماس خود را وارد کنید');
        return;
      }
      
      // Validate phone number (Iranian format)
      const phoneRegex = /^09\d{9}$/;
      // Use normalizePhoneNumber utility for consistency with backend
      const normalizedPhone = normalizePhoneNumber(userPhone);
      if (!phoneRegex.test(normalizedPhone)) {
        alert('لطفاً شماره تماس معتبر وارد کنید (مثال: 09123456789)');
        return;
      }
      
      // Show loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'در حال اتصال به درگاه...';
      }
      
      // Track "entering gateway" status
      const registrationData = localStorage.getItem('registrationData');
      let firstName = '';
      let lastName = '';
      if (registrationData) {
      try {
          const data = JSON.parse(registrationData);
          if (data.phone) {
        // Split name into first and last name
        const nameParts = userName.split(' ').filter(part => part.trim());
            firstName = nameParts[0] || userName;
            lastName = nameParts.slice(1).join(' ') || '';
            
            // Track entering gateway
            apiService.trackLandingActivity(data.phone, 'payment_initiated', firstName, lastName, {
              action: 'entering_gateway'
            });
          }
        } catch (e) {
          console.error('Failed to parse registration data:', e);
        }
      }
      
      try {
        // Split name into first and last name
        const nameParts = userName.split(' ').filter(part => part.trim());
        firstName = nameParts[0] || userName;
        lastName = nameParts.slice(1).join(' ') || '';
        
        // Get API base URL from window
        const apiBaseUrl = window.API_BASE_URL || 'https://live.fitinoo.ir/api';
        
        // Create payment request
        const response = await fetch(apiBaseUrl + '/payment/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            phone: normalizedPhone,
            amount: window.SUBSCRIPTION_PRICE || 4900000,
            type: 'subscription',
            description: 'اشتراک مادام‌العمر MonetizeAI'
          })
        });
        
        if (!response.ok) {
          throw new Error('خطا در ایجاد درخواست پرداخت');
        }
        
        const data = await response.json();
        
        if (data.success && data.payment_url) {
          // Set flag to prevent tracking left_landing when navigating to payment
          if ((window as any).__setNavigatingToPayment) {
            (window as any).__setNavigatingToPayment(true);
          }
          // Redirect to ZarinPal payment page
          window.location.href = data.payment_url;
        } else {
          throw new Error(data.error || data.message || 'خطا در ایجاد درخواست پرداخت');
        }
      } catch (error) {
        console.error('Payment request failed:', error);
        alert('خطا در اتصال به درگاه پرداخت. لطفاً دوباره تلاش کنید یا با پشتیبانی تماس بگیرید.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ثبت و تهیه اشتراک ویژه';
        }
      }
    }
    
    // Make function available globally
    window.submitAndProceedToPayment = submitAndProceedToPayment;
    
    // Close modal when clicking outside
    document.getElementById('paymentModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closePaymentModal();
      }
    });
    
    // Allow Enter key to submit form
    document.addEventListener('DOMContentLoaded', function() {
      const userNameInput = document.getElementById('userName');
      const userPhoneInput = document.getElementById('userPhone');
      
      if (userNameInput) {
        userNameInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            userPhoneInput?.focus();
          }
        });
      }
      
      if (userPhoneInput) {
        userPhoneInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            submitAndProceedToPayment();
          }
        });
      }
      
      // Payment options modal listeners
      const paymentOptionRadios = document.querySelectorAll('input[name="paymentOption"]');
      paymentOptionRadios.forEach(radio => {
        radio.addEventListener('change', updatePaymentOptionDisplay);
      });
    });
    
    // Payment Options Modal Functions
    function openPaymentOptionsModal() {
      const modal = document.getElementById('paymentOptionsModal');
      modal.classList.add('active');
      // Lock body and html scroll when modal is open
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollY + 'px';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.__modalScrollY = scrollY;
      
      updatePaymentOptionDisplay();
      calculateNextInstallmentDate();
    }
    
    function closePaymentOptionsModal() {
      const modal = document.getElementById('paymentOptionsModal');
      modal.classList.remove('active');
      // Unlock body and html scroll when modal is closed
      const scrollY = window.__modalScrollY || 0;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      window.scrollTo(0, scrollY);
      delete window.__modalScrollY;
    }
    
    function updatePaymentOptionDisplay() {
      const selectedOption = document.querySelector('input[name="paymentOption"]:checked').value;
      const cardToCardInfo = document.getElementById('cardToCardInfoOption');
      const installmentInfo = document.getElementById('installmentInfo');
      
      if (selectedOption === 'card-to-card') {
        cardToCardInfo.style.display = 'block';
        installmentInfo.style.display = 'none';
      } else {
        cardToCardInfo.style.display = 'none';
        installmentInfo.style.display = 'block';
        calculateNextInstallmentDate();
      }
    }
    
    function calculateNextInstallmentDate() {
      // Convert Gregorian to Persian (Jalali) date
      const now = new Date();
      const nextMonth = new Date(now);
      nextMonth.setMonth(now.getMonth() + 1);
      
      const gregorianToPersian = (gYear, gMonth, gDay) => {
        const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isLeap = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        
        if (isLeap(gYear)) gDaysInMonth[1] = 29;
        
        let pYear = gYear - 621;
        let pMonth = 3;
        let pDay = 22;
        
        let days = 0;
        for (let i = 0; i < gYear - 621; i++) {
          days += isLeap(621 + i) ? 366 : 365;
        }
        
        for (let i = 0; i < gMonth; i++) {
          days += gDaysInMonth[i];
        }
        days += gDay - 1;
        
        const persianEpoch = 226899;
        const totalDays = days - persianEpoch;
        
        pYear = Math.floor(totalDays / 365.2422) + 1;
        let remainingDays = totalDays - Math.floor((pYear - 1) * 365.2422);
        
        const persianDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
        const isPersianLeap = (year) => {
          const a = (year + 2346) % 128;
          return a < 30 || (a < 62 && a % 4 === 1) || (a >= 62 && (a - 62) % 4 === 0);
        };
        
        if (isPersianLeap(pYear)) persianDaysInMonth[11] = 30;
        
        pMonth = 1;
        while (remainingDays >= persianDaysInMonth[pMonth - 1]) {
          remainingDays -= persianDaysInMonth[pMonth - 1];
          pMonth++;
        }
        pDay = remainingDays + 1;
        
        return { year: pYear, month: pMonth, day: pDay };
      };
      
      const persianDate = gregorianToPersian(
        nextMonth.getFullYear(),
        nextMonth.getMonth() + 1,
        nextMonth.getDate()
      );
      
      const persianMonths = [
        'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
      ];
      
      const toPersian = n => n.toString().replace(/\\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
      
      const day = toPersian(persianDate.day);
      const month = persianMonths[persianDate.month - 1];
      
      document.getElementById('installmentDateValue').textContent = \`\${day} \${month}\`;
    }
    
    function proceedToPaymentOption() {
      // باز کردن لینک پشتیبانی تلگرام
      window.open('https://t.me/sian_academy_support', '_blank');
      closePaymentOptionsModal();
    }
    
    // Close modal when clicking outside
    document.getElementById('paymentOptionsModal').addEventListener('click', function(e) {
      if (e.target === this) {
        closePaymentOptionsModal();
      }
    });
    
    // Copy card number function
    function copyCardNumber(button, cardNumber) {
      const cardNumberClean = cardNumber.replace(/[^\\d]/g, ''); // Remove non-digits
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cardNumberClean).then(() => {
          // Show success feedback
          const originalText = button.innerHTML;
          button.innerHTML = '✓ کپی شد!';
          button.classList.add('copied');
          
          setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          // Fallback to old method
          fallbackCopy(cardNumberClean, button);
        });
      } else {
        // Fallback for older browsers
        fallbackCopy(cardNumberClean, button);
      }
    }
    
    function fallbackCopy(text, button) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        const originalText = button.innerHTML;
        button.innerHTML = '✓ کپی شد!';
        button.classList.add('copied');
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        alert('شماره کارت: ' + text);
      }
      
      document.body.removeChild(textarea);
    }
  </script>
</body>
</html>
    }`;

  const handleContactModalSuccess = (data: { firstName: string; lastName: string; phone: string }) => {
    setHasContactInfo(true);
    setShowContactModal(false);
    
    // Track landing entry after contact info is provided
    apiService.trackLandingActivity(data.phone, 'entered_landing', data.firstName, data.lastName);
    
    // Update status to "in_landing" after a short delay
    setTimeout(() => {
      apiService.trackLandingActivity(data.phone, 'in_landing', data.firstName, data.lastName);
    }, 1000);
  };

  return (
    <>
      <LandingContactModal 
        open={showContactModal && !hasContactInfo} 
        onSuccess={handleContactModalSuccess}
      />
      {hasContactInfo && <div dangerouslySetInnerHTML={{ __html: landingHTML }} />}
    </>
  );
};

export default AIPage;