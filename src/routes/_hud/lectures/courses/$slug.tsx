import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_hud/lectures/courses/$slug')({
  component: CourseLayout,
})

function CourseLayout() {
  return <Outlet />
}
