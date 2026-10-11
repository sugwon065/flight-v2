import SearchFieldSelect from './SearchFieldSelect'

const OPTIONS = Array.from({ length: 15 }, (_, index) => ({
  value: index + 1,
  label: `${index}박 ${index + 1}일`,
}))

export default function TripDurationSelect(props) {
  return <SearchFieldSelect {...props} id="sf-trip-days" label="여행일수" options={OPTIONS} fieldClassName="sf-duration-field" />
}
