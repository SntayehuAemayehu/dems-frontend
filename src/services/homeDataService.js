import { homeDataService } from '../../services/homeDataService';

// In fetchHomePageData function:
const fetchHomePageData = async () => {
  try {
    const data = await homeDataService.getHomePageData();
    setRealStats(data.stats);
    setTestimonials(data.testimonials);
    setCourseCategories(data.courseCategories);
    setBlogPosts(data.blogPosts);
    setPartners(data.partners);
  } catch (error) {
    console.error('Failed to fetch home page data:', error);
  }
};