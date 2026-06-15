import { colors } from "../theme";

const categories = {
  electronics: { key: "electronics", name: "Electronics", emoji: "📱", color: colors.markers.electronics },
  vehicles:    { key: "vehicles",    name: "Vehicles",    emoji: "🚗", color: colors.markers.vehicles },
  furniture:   { key: "furniture",   name: "Furniture",   emoji: "🪑", color: colors.markers.furniture },
  sports:      { key: "sports",      name: "Sports",      emoji: "⚽", color: colors.markers.sports },
  clothing:    { key: "clothing",    name: "Clothing",    emoji: "👕", color: colors.markers.clothing },
  books:       { key: "books",       name: "Books",       emoji: "📚", color: colors.markers.books },
  home:        { key: "home",        name: "Home",        emoji: "🏠", color: colors.markers.home },
  services:    { key: "services",    name: "Services",    emoji: "🛠️", color: colors.markers.services },
  other:       { key: "other",       name: "Other",       emoji: "📦", color: colors.markers.other },
};

export default categories;
