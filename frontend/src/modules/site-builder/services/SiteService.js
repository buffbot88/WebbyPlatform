// Site service - handles site operations
export class SiteService {
  // Get site data (in future, this will call API)
  static async getSite(siteId) {
    // For now, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          siteId: "demo",
          mode: "single",
          theme: {
            primaryColor: "#4f46e5",
            font: "inter",
            style: "modern"
          },
          pages: [
            {
              id: "home",
              name: "Home",
              sections: []
            }
          ],
          events: []
        })
      }, 100)
    })
  }

  // Update site (in future, this will call API)
  static async updateSite(siteId, updates) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...updates, siteId })
      }, 100)
    })
  }

  // Add page
  static async addPage(siteId, page) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(page)
      }, 100)
    })
  }

  // Remove page
  static async removePage(siteId, pageId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ pageId })
      }, 100)
    })
  }

  // Add section
  static async addSection(siteId, pageId, section) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(section)
      }, 100)
    })
  }

  // Remove section
  static async removeSection(siteId, pageId, sectionIndex) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ pageId, sectionIndex })
      }, 100)
    })
  }
}