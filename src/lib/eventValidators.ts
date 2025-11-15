import { getEventPolicy } from './eventPolicy';
import { listEvents } from '../services/eventsService';
import { CreateEventInput, Event } from '../types';

/**
 * Normalize text for moderation by converting to lowercase, stripping accents,
 * replacing unicode homoglyphs, and normalizing leetspeak
 */
export const normalizeForModeration = (text: string): string => {
  return text
    .toLowerCase()
    // Strip accents and diacritics
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace unicode homoglyphs with common characters
    .replace(/[а-я]/g, (char) => {
      const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      };
      return map[char] || char;
    })
    // Normalize leetspeak
    .replace(/4/g, 'a')
    .replace(/1/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    // Remove extra spaces and special characters
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Check if text contains profane content after normalization
 */
export const isProfane = (text: string, denylist: string[]): boolean => {
  const normalized = normalizeForModeration(text);
  
  // Check for whole word matches
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (denylist.includes(word)) {
      return true;
    }
  }
  
  // Check for word boundary matches
  for (const profane of denylist) {
    const regex = new RegExp(`\\b${profane.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Validate event input against policy limits and content rules
 */
export const validateEventInput = async (
  input: CreateEventInput & { image?: string },
  createdBy: string,
  denylist: string[] = []
): Promise<{ ok: boolean; errors: string[] }> => {
  const errors: string[] = [];
  
  try {
    // Get event policy
    const policy = await getEventPolicy();
    
    // Validate title
    if (!input.title || input.title.trim().length === 0) {
      errors.push('Title is required');
    } else if (input.title.length > policy.limits.maxTitleLen) {
      errors.push(`Title must be ${policy.limits.maxTitleLen} characters or less`);
    } else if (isProfane(input.title, denylist)) {
      errors.push('Title contains inappropriate content');
    }
    
    // Validate description
    if (!input.description || input.description.trim().length === 0) {
      errors.push('Description is required');
    } else if (input.description.length > policy.limits.maxDescLen) {
      errors.push(`Description must be ${policy.limits.maxDescLen} characters or less`);
    } else if (isProfane(input.description, denylist)) {
      errors.push('Description contains inappropriate content');
    }
    
    // Validate location
    if (!input.location || input.location.trim().length === 0) {
      errors.push('Location is required');
    } else if (isProfane(input.location, denylist)) {
      errors.push('Location contains inappropriate content');
    }
    
    // Validate date
    if (!input.dateISO) {
      errors.push('Date is required');
    } else {
      const eventDate = new Date(input.dateISO);
      const now = new Date();
      
      if (isNaN(eventDate.getTime())) {
        errors.push('Invalid date format');
      } else if (eventDate <= now) {
        errors.push('Event date must be in the future');
      }
    }
    
    // Validate club ID
    if (!input.clubId || input.clubId.trim().length === 0) {
      errors.push('Club selection is required');
    }
    
    // Validate image if provided
    if (input.image) {
      if (!policy.limits.allowImages) {
        errors.push('Images are not allowed for events');
      } else {
        // Validate MIME type
        const validMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
        const mimeType = input.image.split(';')[0].split(':')[1];
        if (!validMimeTypes.includes(mimeType)) {
          errors.push('Image must be PNG, JPEG, or WebP format');
        }
        
        // Validate file size (convert MB to bytes)
        const maxSizeBytes = policy.limits.maxImageMB * 1024 * 1024;
        const base64Data = input.image.split(',')[1];
        const sizeBytes = (base64Data.length * 3) / 4; // Approximate base64 to bytes conversion
        
        if (sizeBytes > maxSizeBytes) {
          errors.push(`Image size must be ${policy.limits.maxImageMB}MB or less`);
        }
        
        // Note: createImageBitmap validation would require a browser environment
        // For React Native, we'll skip this check or implement a different approach
      }
    }
    
    // Check rate limits
    const events = await listEvents();
    
    // Check max events per club per day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const clubEventsToday = events.filter(event => {
      const eventDate = new Date(event.createdAt);
      return event.clubId === input.clubId && 
             eventDate >= today && 
             eventDate < tomorrow;
    });
    
    if (clubEventsToday.length >= policy.limits.maxPerClubPerDay) {
      errors.push(`Maximum ${policy.limits.maxPerClubPerDay} events per club per day allowed`);
    }
    
    // Check user cooldown
    const userEvents = events.filter(event => event.createdBy === createdBy);
    if (userEvents.length > 0) {
      const lastEvent = userEvents.sort((a, b) => b.createdAt - a.createdAt)[0];
      const timeSinceLastEvent = Date.now() - lastEvent.createdAt;
      const cooldownMs = policy.limits.userCooldownMinutes * 60 * 1000;
      
      if (timeSinceLastEvent < cooldownMs) {
        const remainingMinutes = Math.ceil((cooldownMs - timeSinceLastEvent) / (60 * 1000));
        errors.push(`Please wait ${remainingMinutes} more minutes before creating another event`);
      }
    }
    
    return {
      ok: errors.length === 0,
      errors
    };
    
  } catch (error) {
    console.error('Error validating event input:', error);
    return {
      ok: false,
      errors: ['Validation error occurred']
    };
  }
};

/**
 * Get a default profanity denylist
 */
export const getDefaultDenylist = (): string[] => {
  return [
    // Add common profanity words here
    // This is a basic list - in production, you'd want a more comprehensive list
    'spam', 'scam', 'fake', 'bot'
  ];
};
