import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { Blog } from '@/types/domain'

export function useAdminBlogs() {
  return useQuery({
    queryKey: ['admin', 'blogs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blogs').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useAdminBlog(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'blog', id],
    enabled: !!id && id !== 'new',
    queryFn: async () => {
      const { data, error } = await supabase.from('blogs').select('*').eq('id', id!).single()
      if (error) throw error
      return data
    },
  })
}

export function useSaveBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blog: Partial<Blog> & { id?: string }) => {
      if (blog.id) {
        const { error } = await supabase.from('blogs').update(blog).eq('id', blog.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('blogs').insert(blog as Omit<Blog, 'id' | 'created_at'>)
        if (error) throw error
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] }),
  })
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blogs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'blogs'] }),
  })
}
